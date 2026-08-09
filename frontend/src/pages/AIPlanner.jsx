import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Archive, CalendarDays, Check, Clock3, FileText, KeyRound, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import api from "../lib/api.js";
import { Link } from "react-router-dom";
import { todayISO, formatDate } from "../lib/date.js";
import ButtonSpinner from "../components/ButtonSpinner.jsx";
import PageLoader from "../components/PageLoader.jsx";

const examples = [
  "Learn MERN Stack in 60 days, 2 hours daily",
  "Build a daily DSA practice routine",
  "Read 20 pages every day for the next month",
];

export default function AIPlanner() {
  const [mode, setMode] = useState("create");
  const [prompt, setPrompt] = useState("");
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState({ used: 0, limit: 3, remaining: 3, personalKeyConfigured: false, canUseAi: true, usedPersonalKey: false });
  const [selectedDay, setSelectedDay] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [dailyTime, setDailyTime] = useState(120);
  const [startDate, setStartDate] = useState(todayISO());
  const [deadline, setDeadline] = useState("");
  const [uploadMode, setUploadMode] = useState("break_down");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    try {
      const [usageRes, plansRes] = await Promise.all([api.get("/ai/usage"), api.get("/ai/plans")]);
      const list = plansRes.data.plans || [];
      setUsage(usageRes.data);
      setPlans(list);
      if (list[0]?._id) await selectPlan(list[0]._id);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load your plans.");
    } finally {
      setLoading(false);
    }
  }

  async function selectPlan(id) {
    if (!id) return;
    setLoadingPlan(true);
    setError("");
    try {
      const res = await api.get(`/ai/plans/${id}`);
      setPlan(res.data.plan);
      setSelectedDay(1);
    } catch (err) {
      setError(err.response?.data?.error || "Could not open this plan.");
    } finally {
      setLoadingPlan(false);
    }
  }

  useEffect(() => { load(); }, []);

  const todayTasks = useMemo(() => plan?.tasks?.filter((task) => task.date === todayISO()) || [], [plan]);
  const dayTasks = useMemo(() => plan?.tasks?.filter((task) => task.day === selectedDay) || [], [plan, selectedDay]);
  const completedTasks = plan?.tasks?.filter((task) => task.done).length || 0;
  const taskProgress = plan?.tasks?.length ? Math.round((completedTasks / plan.tasks.length) * 100) : 0;

  const setNewPlanMode = (nextMode) => {
    setPlan(null);
    setMode(nextMode);
    setError("");
  };

  const addPlanToHistory = (newPlan) => {
    setPlans((prev) => [
      { ...newPlan, tasks: undefined },
      ...prev.filter((item) => String(item._id) !== String(newPlan._id)),
    ]);
    setPlan(newPlan);
    setSelectedDay(1);
  };

  const generate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || generating || !usage.canUseAi) return;
    setGenerating(true); setError("");
    try {
      const res = await api.post("/ai/plan", { prompt: prompt.trim() });
      setUsage(res.data.usage);
      addPlanToHistory(res.data.plan);
    } catch (err) {
      setError(err.response?.data?.error || "Could not generate your plan.");
    } finally { setGenerating(false); }
  };

  const uploadRoadmap = async (e) => {
    e?.preventDefault();
    if (!file || generating || !usage.canUseAi) return;
    setGenerating(true); setError("");
    try {
      const body = new FormData();
      body.append("roadmap", file);
      body.append("dailyTimeMinutes", String(dailyTime));
      body.append("startDate", startDate);
      body.append("deadline", deadline);
      body.append("mode", uploadMode);
      const res = await api.post("/ai/roadmap-upload", body);
      setUsage(res.data.usage);
      addPlanToHistory(res.data.plan);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not turn that roadmap into a plan.");
    } finally { setGenerating(false); }
  };

  const toggleTask = async (task) => {
    if (!plan) return;
    const next = !task.done;
    setPlan((prev) => ({ ...prev, tasks: prev.tasks.map((t) => t._id === task._id ? { ...t, done: next } : t) }));
    try { await api.patch(`/ai/plans/${plan._id}/tasks/${task._id}`, { done: next }); }
    catch { setPlan((prev) => ({ ...prev, tasks: prev.tasks.map((t) => t._id === task._id ? { ...t, done: !next } : t) })); }
  };

  const deletePlan = async () => {
    if (!plan) return;
    try {
      await api.delete(`/ai/plans/${plan._id}`);
      const remaining = plans.filter((item) => String(item._id) !== String(plan._id));
      setPlans(remaining);
      setConfirmDelete(false);
      if (remaining[0]?._id) await selectPlan(remaining[0]._id);
      else setPlan(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this plan.");
    }
  };

  const archivePlan = async () => {
    if (!plan) return;
    try {
      await api.patch(`/ai/plans/${plan._id}/archive`, { archived: true });
      setPlans((prev) => prev.filter((item) => String(item._id) !== String(plan._id)));
      const next = plans.find((item) => String(item._id) !== String(plan._id));
      if (next?._id) await selectPlan(next._id);
      else setPlan(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not archive this plan.");
    }
  };

  if (loading) return <PageLoader label="Loading your plans…" />;

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <header className="mb-7">
        <p className="eyebrow">Planning studio</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold mt-1">Make the plan. Keep the plan.</h1>
            <p className="text-sm text-textMuted mt-2 max-w-2xl">Build a roadmap from a goal, or bring your own roadmap and turn it into daily execution. Every plan you create is saved separately.</p>
          </div>
          <div className="plan-quota">
            {usage.usedPersonalKey ? <><KeyRound size={14} className="text-cream" /><span className="text-textPrimary">Using your Gemini key</span></> : <><span className="font-display text-2xl">{usage.remaining}</span><span>Habitly runs left today</span></>}
          </div>
        </div>
      </header>

      {usage.remaining <= 0 && (
        <section className="key-handoff mb-7">
          <div className="flex items-start gap-3">
            <span className="mode-icon shrink-0"><KeyRound size={17} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Your 3 Habitly AI runs are used.</p>
              <p className="text-xs text-textMuted mt-1 leading-relaxed">{usage.personalKeyConfigured ? "Your personal Gemini key will be used automatically for the next generation." : "Connect your own Gemini API key to keep creating plans today."}</p>
            </div>
            {!usage.personalKeyConfigured && <Link to="/profile" className="secondary-button shrink-0">Connect key <ArrowRight size={12} /></Link>}
          </div>
        </section>
      )}

      {plans.length > 0 && (
        <section className="mb-7">
          <div className="flex items-end justify-between mb-3"><div><p className="eyebrow">Your plans</p><h2 className="font-display text-2xl font-semibold mt-1">Saved separately</h2></div><span className="text-[10px] text-textMuted">{plans.length} plan{plans.length === 1 ? "" : "s"}</span></div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x">
            {plans.map((item) => (
              <button key={item._id} onClick={() => selectPlan(item._id)} className={`plan-chip snap-start ${String(plan?._id) === String(item._id) ? "plan-chip-active" : ""}`}>
                <span className="w-8 h-8 rounded-lg bg-accentSoft flex items-center justify-center shrink-0">{item.source === "uploaded_roadmap" ? <FileText size={15} /> : <Sparkles size={15} />}</span>
                <span className="min-w-0 text-left"><strong className="block text-xs truncate max-w-[180px]">{item.title}</strong><small>{item.source === "uploaded_roadmap" ? "Your roadmap" : "AI generated"} · {new Date(item.createdAt).toLocaleDateString()}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {plan ? (
        loadingPlan ? <PageLoader label="Opening your plan…" /> : <PlanView plan={plan} selectedDay={selectedDay} setSelectedDay={setSelectedDay} todayTasks={todayTasks} dayTasks={dayTasks} toggleTask={toggleTask} taskProgress={taskProgress} onNew={() => setNewPlanMode("create")} onArchive={archivePlan} onDelete={() => setConfirmDelete(true)} error={error} />
      ) : (
        <>
          <section className="grid md:grid-cols-2 gap-4 mb-6">
            <ModeCard active={mode === "create"} icon={Wand2} eyebrow="Start from zero" title="Create with AI" text="Describe the goal. Habitly builds milestones, daily tasks and a few useful supporting habits." onClick={() => setMode("create")} />
            <ModeCard active={mode === "upload"} icon={FileText} eyebrow="Bring your own roadmap" title="Use my roadmap" text="Upload a PDF, DOCX, TXT or Markdown roadmap and turn its topics into a realistic daily plan." onClick={() => setMode("upload")} />
          </section>

          {mode === "create" && <form onSubmit={generate} className="editor-panel">
            <label className="eyebrow">Your goal</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={2000} rows={5} placeholder="Example: I want to become job-ready in MERN in 60 days. I can study 2 hours daily." className="mt-3 w-full bg-bg border border-border rounded-2xl p-4 text-sm outline-none resize-none focus:border-cream" />
            <div className="flex flex-wrap gap-2 mt-3">{examples.map((example) => <button type="button" key={example} onClick={() => setPrompt(example)} className="suggestion-chip">{example}</button>)}</div>
            {error && <p className="text-xs text-pink mt-3">{error}</p>}
            <button disabled={!prompt.trim() || generating || !usage.canUseAi} className="primary-button mt-5">{generating ? <ButtonSpinner label="Building your plan…" /> : <>Build my plan <ArrowRight size={15} /></>}</button>
          </form>}

          {mode === "upload" && <form onSubmit={uploadRoadmap} className="editor-panel">
            <div onClick={() => fileRef.current?.click()} className="upload-zone">
              <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="upload-icon"><Upload size={20} /></span>
              <p className="text-sm font-semibold">{file ? file.name : "Choose your roadmap"}</p>
              <p className="text-xs text-textMuted mt-1">PDF, DOCX, TXT or Markdown · up to 5 MB</p>
            </div>
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <Field label="Daily time"><select value={dailyTime} onChange={(e) => setDailyTime(Number(e.target.value))}><option value={30}>30 min</option><option value={60}>1 hour</option><option value={90}>90 min</option><option value={120}>2 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option></select></Field>
              <Field label="Start date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
              <Field label="Deadline (optional)"><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
            </div>
            <div className="mt-4"><p className="eyebrow mb-2">Roadmap handling</p><div className="grid md:grid-cols-2 gap-2"><button type="button" onClick={() => setUploadMode("break_down")} className={`choice-card ${uploadMode === "break_down" ? "choice-active" : ""}`}><p className="text-xs font-semibold">Break into daily actions</p><p className="text-[10px] text-textMuted mt-1">Preserve the topics, then make the workload practical.</p></button><button type="button" onClick={() => setUploadMode("follow_exactly")} className={`choice-card ${uploadMode === "follow_exactly" ? "choice-active" : ""}`}><p className="text-xs font-semibold">Follow it closely</p><p className="text-[10px] text-textMuted mt-1">Stay close to the uploaded roadmap and avoid unrelated material.</p></button></div></div>
            {error && <p className="text-xs text-pink mt-3">{error}</p>}
            <button disabled={!file || generating || !usage.canUseAi} className="primary-button mt-5">{generating ? <ButtonSpinner label="Reading roadmap…" /> : <>Turn roadmap into a plan <ArrowRight size={15} /></>}</button>
          </form>}
        </>
      )}

      {confirmDelete && plan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm bg-bgTop border border-border rounded-2xl p-5 shadow-2xl">
            <p className="eyebrow">Delete plan</p>
            <h3 className="font-display text-2xl font-semibold mt-1">Remove “{plan.title}”?</h3>
            <p className="text-xs text-textMuted mt-2 leading-relaxed">This permanently removes the saved AI plan, its tasks and the supporting habits created for this plan.</p>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setConfirmDelete(false)} className="secondary-button flex-1">Cancel</button>
              <button type="button" onClick={deletePlan} className="flex-1 rounded-full bg-pink text-[#3A2530] font-semibold text-xs py-2.5">Delete plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({ active, icon: Icon, eyebrow, title, text, onClick }) {
  return <button type="button" onClick={onClick} className={`mode-card ${active ? "mode-card-active" : ""}`}><span className="mode-icon"><Icon size={18} /></span><p className="eyebrow mt-5">{eyebrow}</p><h2 className="font-display text-2xl font-semibold mt-1">{title}</h2><p className="text-xs text-textMuted mt-2 leading-relaxed">{text}</p><span className="inline-flex items-center gap-1 text-xs font-semibold text-cream mt-5">Choose <ArrowRight size={12} /></span></button>;
}

function Field({ label, children }) { return <label className="block"><span className="eyebrow">{label}</span>{React.cloneElement(children, { className: "field-control" })}</label>; }

function PlanView({ plan, selectedDay, setSelectedDay, todayTasks, dayTasks, toggleTask, taskProgress, onNew, onArchive, onDelete, error }) {
  const currentDay = Math.min(plan.durationDays, Math.max(1, Math.floor((new Date(todayISO()) - new Date(`${plan.startDate}T00:00:00`)) / 86400000) + 1));
  const todayComplete = todayTasks.length > 0 && todayTasks.every((t) => t.done);
  return <>
    <section className="plan-hero">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 relative z-10">
        <div><div className="flex flex-wrap items-center gap-2 mb-3"><span className="source-pill">{plan.source === "uploaded_roadmap" ? "Your roadmap" : "AI generated"}</span>{plan.sourceFileName && <span className="text-[9px] text-textMuted">{plan.sourceFileName}</span>}</div><h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">{plan.title}</h2><p className="text-sm text-textMuted mt-2 max-w-2xl">{plan.summary}</p></div>
        <div className="flex gap-2"><button onClick={onNew} className="secondary-button">New plan</button><button onClick={onArchive} className="icon-button" title="Archive this plan"><Archive size={15} /></button><button onClick={onDelete} className="icon-button text-pink" title="Delete this plan"><Trash2 size={15} /></button></div>
      </div>
      <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10"><Stat label="Progress" value={`${taskProgress}%`} /><Stat label="Day" value={`${currentDay}/${plan.durationDays}`} /><Stat label="Daily time" value={`${plan.dailyTimeMinutes}m`} /><Stat label="Tasks" value={String(plan.tasks?.length || 0)} /></div>
      <div className="progress-track mt-4 relative z-10"><div className="progress-fill" style={{ width: `${taskProgress}%` }} /></div>
    </section>

    {todayComplete && <div className="success-note"><Check size={17} /><div><p className="text-xs font-semibold">Today's focus is complete.</p><p className="text-[10px] text-textMuted mt-0.5">Tomorrow's tasks stay locked until their date arrives.</p></div></div>}

    <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-5 mt-5">
      <section className="content-panel"><div className="section-heading"><div><p className="eyebrow">Today · {formatDate(todayISO())}</p><h3 className="font-display text-2xl font-semibold mt-1">Daily execution</h3></div><Clock3 size={17} className="text-textMuted" /></div><div className="space-y-2">{todayTasks.length ? todayTasks.map((task) => <TaskRow key={task._id} task={task} onClick={() => toggleTask(task)} />) : <p className="text-xs text-textMuted py-8 text-center">No tasks scheduled for today.</p>}</div></section>
      <section className="content-panel"><div className="section-heading"><div><p className="eyebrow">Milestones</p><h3 className="font-display text-2xl font-semibold mt-1">The route</h3></div><CalendarDays size={17} className="text-textMuted" /></div><div className="space-y-1">{plan.milestones?.map((m, i) => <div key={i} className="milestone-row"><span className="milestone-index">{i + 1}</span><div className="flex-1"><p className="text-xs font-semibold">{m.title}</p><p className="text-[9px] text-textMuted mt-1">Days {m.startDay}–{m.endDay}</p></div></div>)}</div></section>
    </div>

    {plan.durationDays > 1 && <section className="content-panel mt-5"><div className="section-heading"><div><p className="eyebrow">Roadmap</p><h3 className="font-display text-2xl font-semibold mt-1">Choose a day</h3></div><span className="text-[10px] text-textMuted">Day {selectedDay}</span></div><div className="flex gap-2 overflow-x-auto pb-2">{Array.from({ length: Math.min(plan.durationDays, 30) }, (_, i) => i + 1).map((day) => <button key={day} onClick={() => setSelectedDay(day)} className={`day-chip ${selectedDay === day ? "day-chip-active" : ""}`}>{day}</button>)}</div><div className="mt-4 space-y-2">{dayTasks.map((task) => <TaskRow key={task._id} task={task} onClick={() => toggleTask(task)} />)}</div></section>}

    {error && <p className="text-xs text-pink mt-4">{error}</p>}

    <section className="content-panel mt-5"><div className="section-heading"><div><p className="eyebrow">Supporting habits</p><h3 className="font-display text-2xl font-semibold mt-1">Keep the system steady</h3></div><span className="text-[10px] text-textMuted">{plan.suggestedHabits?.length || 0} habits</span></div><div className="grid md:grid-cols-2 gap-2">{plan.suggestedHabits?.map((habit) => <div key={habit.name} className="support-habit"><p className="text-xs font-semibold">{habit.name}</p><p className="text-[9px] text-textMuted mt-1">{habit.category} · {habit.frequency}</p></div>)}</div></section>
  </>;
}

function TaskRow({ task, onClick }) { return <button onClick={onClick} className="task-row"><span className={`task-check ${task.done ? "task-check-done" : ""}`}>{task.done && <Check size={13} />}</span><span className={`flex-1 min-w-0 text-xs font-semibold ${task.done ? "line-through text-textMuted" : ""}`}>{task.title}</span><span className="text-[9px] text-textMuted">{task.durationMinutes}m</span></button>; }
function Stat({ label, value }) { return <div className="stat-box"><p className="eyebrow">{label}</p><p className="font-display text-xl font-semibold mt-1">{value}</p></div>; }
