import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Flame, Plus, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import HabitFormModal from "../components/HabitFormModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";
import { todayISO, formatDate } from "../lib/date.js";
import ProgressRing from "../components/ProgressRing.jsx";
import HabitCard from "../components/HabitCard.jsx";
import PageLoader from "../components/PageLoader.jsx";

const QUOTES = [
  "Small steps, repeated daily, beat big leaps taken rarely.",
  "You don't rise to your goals. You fall to your systems.",
  "Discipline is choosing between what you want now and what you want most.",
  "Progress is invisible until, one day, it isn't.",
  "Consistency is the quiet work no one applauds.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [doneMap, setDoneMap] = useState({});
  const [aiPlan, setAiPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const today = todayISO();

  async function load() {
    setLoading(true);
    try {
      const [habitsRes, checkinsRes, aiRes] = await Promise.all([
        api.get("/habits"),
        api.get("/checkins", { params: { from: today, to: today } }),
        api.get("/ai/plans/active/today"),
      ]);
      setHabits(habitsRes.data.habits || []);
      const map = {};
      (checkinsRes.data.checkins || []).forEach((c) => {
        const habitId = c.habitId || c.habit_id;
        if (habitId) map[String(habitId)] = c.status !== null;
      });
      setDoneMap(map);
      setAiPlan(aiRes.data.plan || null);
    } catch (err) {
      setToast(err.response?.data?.error || "Could not load today's plan.");
      setTimeout(() => setToast(null), 3500);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const toggle = async (habitId) => {
    if (doneMap[habitId]) return;
    setDoneMap((prev) => ({ ...prev, [habitId]: true }));
    try {
      const res = await api.post("/checkins/toggle", { habitId, date: today });
      setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, currentStreak: h.currentStreak + (res.data.done ? 1 : 0) } : h));
    } catch (err) {
      setDoneMap((prev) => ({ ...prev, [habitId]: false }));
      setToast(err.response?.data?.error || "Could not complete this habit.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const activeHabits = habits.filter((h) => !h.archived);
  const mainHabits = activeHabits.filter((h) => (h.trackGroup || (h.source === "ai" ? "ai" : "main")) === "main");
  const otherHabits = activeHabits.filter((h) => (h.trackGroup || (h.source === "ai" ? "ai" : "main")) === "other");
  const completedMain = mainHabits.filter((h) => doneMap[h.id]).length;
  const mainPct = mainHabits.length ? Math.round((completedMain / mainHabits.length) * 100) : 0;
  const todayTasks = aiPlan?.todayTasks || [];
  const aiDone = todayTasks.filter((t) => t.done).length;
  const aiCurrentDay = aiPlan ? Math.min(aiPlan.durationDays, Math.max(1, Math.floor((new Date(today) - new Date(`${aiPlan.startDate}T00:00:00`)) / 86400000) + 1)) : 0;
  const aiTimelinePct = aiPlan?.durationDays ? Math.round((aiCurrentDay / aiPlan.durationDays) * 100) : 0;
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const topStreak = [...mainHabits, ...otherHabits].sort((a, b) => b.currentStreak - a.currentStreak)[0];

  const toggleAiTask = async (task) => {
    if (!aiPlan) return;
    const next = !task.done;
    setAiPlan((prev) => ({ ...prev, todayTasks: prev.todayTasks.map((t) => t._id === task._id ? { ...t, done: next } : t) }));
    try {
      await api.patch(`/ai/plans/${aiPlan._id}/tasks/${task._id}`, { done: next });
    } catch {
      setAiPlan((prev) => ({ ...prev, todayTasks: prev.todayTasks.map((t) => t._id === task._id ? { ...t, done: !next } : t) }));
    }
  };

  if (loading) return <PageLoader label="Preparing your day…" />;

  return (
    <div className="relative fade-in">
      {toast && <div className="toast-message">{toast}</div>}

      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="eyebrow">Today · your daily system</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold leading-none mt-1">{greeting}{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>
          <p className="text-textMuted text-sm mt-2">{formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-xs font-semibold border border-border bg-surface px-3 py-2 rounded-full hover:bg-surfaceRaised"><Plus size={14} /> New habit</button>
      </header>

      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-5 mb-8">
        <section className="hero-panel">
          <div className="flex items-center justify-between gap-4">
            <div><p className="eyebrow">Main goal</p><h2 className="font-display text-3xl font-semibold mt-1">Your day</h2><p className="text-xs text-textMuted mt-2">Your everyday commitments, kept separate from AI plans.</p></div>
            <ProgressRing pct={mainPct} size={126} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2"><Metric label="Completed" value={`${completedMain}/${mainHabits.length || 0}`} sub={`${mainPct}% today`} /><Metric label="Best current" value={`${topStreak?.currentStreak || 0}d`} sub={topStreak?.name || "Start a streak"} /></div>
        </section>

        <section className="ai-focus-panel">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div><p className="eyebrow">AI focus</p><h2 className="font-display text-2xl md:text-3xl font-semibold mt-1">{aiPlan?.title || "Turn a goal into a plan"}</h2><p className="text-xs text-textMuted mt-1">{aiPlan ? `${aiPlan.source === "uploaded_roadmap" ? "Your roadmap" : "Built by Habitly"} · Day ${aiCurrentDay}/${aiPlan.durationDays}` : "Create a roadmap or bring your own."}</p></div>
            <span className="ai-mark"><Sparkles size={16} /></span>
          </div>
          {aiPlan ? <>
            <div className="progress-track mt-5 relative z-10"><div className="progress-fill progress-yellow" style={{ width: `${aiTimelinePct}%` }} /></div>
            <div className="flex items-center justify-between mt-5 mb-2"><p className="text-xs font-semibold">Today's execution</p><span className="text-[10px] text-textMuted">{aiDone}/{todayTasks.length}</span></div>
            <div className="space-y-2 relative z-10">{todayTasks.slice(0, 4).map((task) => <button key={task._id} onClick={() => toggleAiTask(task)} className="task-row-transparent"><span className={`task-check ${task.done ? "task-check-done" : ""}`}>{task.done && <Check size={12} />}</span><span className={`text-xs flex-1 text-left ${task.done ? "line-through text-textMuted" : ""}`}>{task.title}</span><span className="text-[9px] text-textMuted">{task.durationMinutes}m</span></button>)}{!todayTasks.length && <p className="text-xs text-textMuted py-3">No task is scheduled for today.</p>}</div>
            {todayTasks.length > 0 && aiDone === todayTasks.length && <p className="success-inline mt-4">Today's AI focus is complete.</p>}
            <Link to="/ai" className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-cream relative z-10">Open plan <ArrowRight size={13} /></Link>
          </> : <Link to="/ai" className="inline-flex items-center gap-2 mt-7 text-xs font-semibold text-cream relative z-10">Create your first plan <ArrowRight size={13} /></Link>}
        </section>
      </div>

      <section className="mb-8">
        <div className="flex items-end justify-between mb-3"><div><p className="eyebrow">Priority</p><h2 className="font-display text-2xl font-semibold mt-1">Daily main goal</h2></div><span className="text-xs text-textMuted">{completedMain}/{mainHabits.length} complete</span></div>
        {mainHabits.length === 0 ? <EmptyState label="Create the habits that define your main daily routine." /> : <div className="grid md:grid-cols-2 gap-2.5"><AnimatePresence>{mainHabits.map((h, i) => <HabitCard key={h.id} habit={h} done={!!doneMap[h.id]} onToggle={toggle} index={i} />)}</AnimatePresence></div>}
        {mainHabits.length > 0 && completedMain === mainHabits.length && <p className="success-inline mt-3">Today's main goal is complete. Tomorrow starts a fresh check-in.</p>}
      </section>

      {otherHabits.length > 0 && <section>
        <div className="flex items-end justify-between mb-3"><div><p className="eyebrow">Supporting routines</p><h2 className="font-display text-2xl font-semibold mt-1">Other habits</h2></div><Link to="/habits" className="text-xs text-textMuted hover:text-textPrimary">Manage</Link></div>
        <div className="grid md:grid-cols-2 gap-2.5">{otherHabits.map((h, i) => <HabitCard key={h.id} habit={h} done={!!doneMap[h.id]} onToggle={toggle} index={i} />)}</div>
      </section>}

      <div className="mt-9 border-l-2 border-cream pl-4 max-w-2xl"><p className="text-sm italic text-textSecondary leading-relaxed">“{quote}”</p></div>

      {showCreate && <HabitFormModal onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  );
}

function Metric({ label, value, sub }) { return <div className="metric-box"><p className="eyebrow">{label}</p><p className="font-display text-2xl font-semibold mt-1">{value}</p><p className="text-[10px] text-textMuted mt-0.5 truncate">{sub}</p></div>; }
function EmptyState({ label }) { return <div className="empty-state"><Target size={20} className="mx-auto text-textMuted mb-2" /><p className="text-xs text-textMuted">{label}</p><Link to="/habits" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-cream">Add habit <ArrowRight size={12} /></Link></div>; }
