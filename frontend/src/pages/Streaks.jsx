import React, { useEffect, useMemo, useState } from "react";
import { Flame, Snowflake, Trophy, Sparkles, Target, Layers3 } from "lucide-react";
import api from "../lib/api.js";
import { getIcon } from "../lib/icons.js";
import { todayISO, addDays } from "../lib/date.js";
import PageLoader from "../components/PageLoader.jsx";

const MILESTONES = [7, 30, 100, 365];

function isAiHabit(habit) {
  return habit.source === "ai" || Boolean(habit.aiPlanId) || habit.trackGroup === "ai";
}

export default function Streaks() {
  const [habits, setHabits] = useState([]);
  const [aiPlans, setAiPlans] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = todayISO();
        const from = addDays(today, -365);
        const [habitsRes, plansRes, checkinsRes] = await Promise.all([
          api.get("/habits"),
          api.get("/ai/plans/streaks"),
          api.get("/checkins", { params: { from, to: today } }),
        ]);
        setHabits(habitsRes.data.habits.filter((h) => !h.archived));
        setAiPlans(plansRes.data.plans || []);
        setCheckins(checkinsRes.data.checkins || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { mainHabits, aiGroups, otherHabits, mainGoalStreak } = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    const mainHabits = active.filter((h) => !isAiHabit(h) && (h.trackGroup || "main") === "main");
    const otherHabits = active.filter((h) => !isAiHabit(h) && (h.trackGroup || "main") === "other");
    const aiHabits = active.filter(isAiHabit);
    const groups = new Map();

    aiHabits.forEach((habit) => {
      const key = habit.aiPlanId ? String(habit.aiPlanId) : "unlinked-ai";
      const plan = aiPlans.find((p) => String(p._id) === key);
      if (!groups.has(key)) groups.set(key, { key, title: plan?.title || "AI Goal", plan: plan || null, items: [] });
      groups.get(key).items.push(habit);
    });

    aiPlans.forEach((plan) => {
      const key = String(plan._id);
      if (!groups.has(key)) groups.set(key, { key, title: plan.title, plan, items: [] });
    });

    const aiGroups = [...groups.values()].sort((a, b) => {
      const ad = a.plan?.createdAt || "";
      const bd = b.plan?.createdAt || "";
      return bd.localeCompare(ad);
    });

    return {
      mainHabits,
      aiGroups,
      otherHabits,
      mainGoalStreak: calculateGroupStreak(mainHabits.map((h) => String(h.id)), checkins),
    };
  }, [habits, aiPlans, checkins]);

  const overallLongest = Math.max(
    0,
    ...habits.map((h) => h.bestStreak || 0),
    ...aiPlans.map((p) => p.best || 0)
  );

  if (loading) return <PageLoader label="Loading your streaks…" />;

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <header className="mb-9">
        <p className="eyebrow">Consistency</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl font-semibold mt-1">Streaks</h1>
            <p className="text-sm text-textMuted mt-2">Every goal keeps its own run. Your roadmap streaks never get mixed with your daily habits.</p>
          </div>
          <div className="text-right text-xs text-textMuted"><span className="font-display text-2xl text-textPrimary">{overallLongest}</span><br />longest run</div>
        </div>
      </header>

      <Group title="Daily Main Goal" subtitle="Your everyday priority habits" icon={Target} items={mainHabits} goalStreak={mainGoalStreak} />

      {aiGroups.map((group) => (
        <Group
          key={group.key}
          title={group.title}
          subtitle={`${group.plan?.source === "uploaded_roadmap" ? "Roadmap plan" : "AI-generated plan"}${group.plan ? ` · ${group.plan.durationDays} days` : ""}`}
          icon={Sparkles}
          items={group.items}
          ai
          goalStreak={group.plan ? { current: group.plan.current || 0, best: group.plan.best || 0 } : null}
        />
      ))}

      <Group title="Other Habits" subtitle="Supporting routines outside your goals" icon={Layers3} items={otherHabits} />

      {!mainHabits.length && !aiGroups.length && !otherHabits.length && (
        <div className="border border-dashed border-border rounded-3xl px-6 py-12 text-center text-sm text-textMuted">Create a habit or an AI plan to start building streaks.</div>
      )}
    </div>
  );
}

function Group({ title, subtitle, icon: Icon, items, ai = false, goalStreak = null }) {
  if (!items.length && !(ai && goalStreak)) return null;
  const best = Math.max(0, ...items.map((h) => h.bestStreak || 0));
  const current = Math.max(0, ...items.map((h) => h.currentStreak || 0));
  const displayCurrent = goalStreak ? goalStreak.current : current;
  const displayBest = goalStreak ? goalStreak.best : best;

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon size={16} className={ai ? "text-yellow" : "text-textMuted"} />
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            {items.length > 0 && <span className="text-[10px] text-textMuted">{items.length} habits</span>}
          </div>
          <p className="text-[11px] text-textMuted mt-1 ml-6">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-textMuted">
          <span>🔥 {displayCurrent} current</span><span>🏆 {displayBest} best</span>
        </div>
      </div>

      {goalStreak && (
        <div className="goal-strip mb-3">
          <div><p className="eyebrow">Goal streak</p><p className="text-sm font-semibold mt-1">{goalStreak.current} day{goalStreak.current === 1 ? "" : "s"} in a row</p></div>
          <div className="text-right"><p className="eyebrow">Best</p><p className="text-sm font-semibold mt-1">{goalStreak.best} days</p></div>
        </div>
      )}

      {items.length > 0 && <div className="grid md:grid-cols-2 gap-3">{items.map((habit) => <StreakCard key={habit.id} habit={habit} />)}</div>}
      {!items.length && ai && goalStreak && <div className="border border-dashed border-border rounded-2xl px-4 py-5 text-xs text-textMuted">This AI goal is tracked through its daily roadmap tasks.</div>}
    </section>
  );
}

function StreakCard({ habit: h }) {
  const Icon = getIcon(h.icon);
  const next = MILESTONES.find((m) => m > h.currentStreak);
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 soft-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${h.color}22` }}><Icon size={18} color={h.color} /></div>
        <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{h.name}</p><p className="text-xs text-textMuted">{h.category}</p></div>
        <Flame size={17} className="text-yellow" />
      </div>
      <div className="flex items-end gap-8 mb-5"><div><p className="font-display text-3xl font-semibold">{h.currentStreak || 0}</p><p className="eyebrow">current</p></div><div><p className="font-display text-2xl font-semibold">{h.bestStreak || 0}</p><p className="eyebrow">best</p></div></div>
      <div className="flex items-center justify-between text-[10px] text-textMuted"><span className="flex items-center gap-1"><Snowflake size={11} /> {h.freeze_passes_remaining} freezes</span>{next ? <span>{next - h.currentStreak}d to {next}</span> : <span>Milestones mastered</span>}</div>
      <div className="mt-4 pt-3 border-t border-border flex gap-1 flex-wrap">{MILESTONES.filter((m) => (h.bestStreak || 0) >= m).map((m) => <span key={m} className="inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-yellow/10 text-cream"><Trophy size={9} />{m}d</span>)}</div>
    </div>
  );
}

function calculateGroupStreak(habitIds, checkins) {
  if (!habitIds.length) return { current: 0, best: 0 };
  const required = new Set(habitIds);
  const byDate = new Map();
  checkins.forEach((checkin) => {
    const habitId = String(checkin.habitId || checkin.habit_id || "");
    if (!required.has(habitId)) return;
    if (!byDate.has(checkin.date)) byDate.set(checkin.date, new Set());
    byDate.get(checkin.date).add(habitId);
  });
  const completedDates = [...byDate.entries()].filter(([, ids]) => ids.size === required.size).map(([date]) => date);
  return calculateDateStreak(completedDates);
}

function calculateDateStreak(dates) {
  const set = new Set(dates);
  const today = todayISO();
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) { current += 1; cursor = addDays(cursor, -1); }
  const sorted = [...set].sort();
  let best = 0; let run = 0; let previous = null;
  for (const date of sorted) {
    if (previous && addDays(previous, 1) === date) run += 1; else run = 1;
    best = Math.max(best, run); previous = date;
  }
  return { current, best };
}
