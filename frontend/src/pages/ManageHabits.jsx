import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, X } from "lucide-react";
import api from "../lib/api.js";
import { getIcon, ICON_NAMES, CATEGORY_COLORS } from "../lib/icons.js";
import { todayISO } from "../lib/date.js";
import PageLoader from "../components/PageLoader.jsx";
import ButtonSpinner from "../components/ButtonSpinner.jsx";

const EMPTY = {
  name: "", category: "General", icon: "Sparkles", color: CATEGORY_COLORS[0],
  frequency: "daily", startDate: todayISO(), reminderTime: "", trackGroup: "main",
};

export default function ManageHabits() {
  const [habits, setHabits] = useState([]);
  const [archived, setArchived] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [active, arch, planRes] = await Promise.all([
        api.get("/habits"),
        api.get("/habits", { params: { archived: true } }),
        api.get("/ai/plans"),
      ]);
      setHabits(active.data.habits);
      setArchived(arch.data.habits);
      setPlans(planRes.data.plans || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const openCreate = () => setForm({ ...EMPTY });
  const openEdit = (h) => setForm({ ...h, startDate: h.start_date, reminderTime: h.reminder_time || "" });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/habits/${form.id}`, form);
      } else {
        await api.post("/habits", form);
      }
      setForm(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/habits/${id}`);
      setConfirmDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const toggleArchive = async (h, archive) => {
    setArchiving(h.id);
    try {
      await api.patch(`/habits/${h.id}/archive`, { archived: archive });
      await load();
    } finally {
      setArchiving(null);
    }
  };

  const list = showArchived ? archived : habits;

  const renderHabit = (h) => {
    const Icon = getIcon(h.icon);
    const linkedPlan = plans.find((p) => String(p._id) === String(h.aiPlanId || ""));
    return (
      <div key={h.id} className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 transition hover:bg-surfaceRaised">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${h.color}22` }}>
          <Icon size={18} color={h.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{h.name}</p>
          <p className="text-xs text-textMuted truncate">{h.source === "ai" ? `AI plan · ${linkedPlan?.title || "Unassigned"}` : h.trackGroup === "other" ? "Other habit" : "Daily main goal"} · {h.category}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {!showArchived && <button onClick={() => openEdit(h)} className="p-2 rounded-lg hover:bg-surfaceRaised" aria-label="Edit"><Pencil size={15} className="text-textSecondary" /></button>}
          <button onClick={() => toggleArchive(h, !showArchived)} className="p-2 rounded-lg hover:bg-surfaceRaised" aria-label={showArchived ? "Restore" : "Archive"}>
            {archiving === h.id ? <span className="block w-3.5 h-3.5 border-2 border-textSecondary border-t-transparent rounded-full animate-spin" /> : (showArchived ? <ArchiveRestore size={15} className="text-textSecondary" /> : <Archive size={15} className="text-textSecondary" />)}
          </button>
          <button onClick={() => setConfirmDelete(h)} className="p-2 rounded-lg hover:bg-surfaceRaised" aria-label="Delete"><Trash2 size={15} className="text-pink" /></button>
        </div>
      </div>
    );
  };

  if (loading) return <PageLoader label="Loading your habits…" />;

  return (
    <div className="max-w-md md:max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-xl font-bold">Manage habits</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-cream text-bg text-xs font-semibold px-3 py-2 rounded-xl">
          <Plus size={14} /> New
        </button>
      </div>
      <div className="flex gap-4 text-xs mt-4 mb-4 border-b border-border">
        <button onClick={() => setShowArchived(false)} className={`pb-2.5 px-1 ${!showArchived ? "text-cream border-b-2 border-cream font-semibold" : "text-textMuted"}`}>Active ({habits.length})</button>
        <button onClick={() => setShowArchived(true)} className={`pb-2.5 px-1 ${showArchived ? "text-cream border-b-2 border-cream font-semibold" : "text-textMuted"}`}>Archived ({archived.length})</button>
      </div>

      {list.length === 0 ? <p className="text-sm text-textMuted py-8 text-center">Nothing here yet.</p> : <div className="space-y-7">
        <HabitGroup title="Daily main goal" eyebrow="Priority habits" habits={list.filter((h) => h.source !== "ai" && h.trackGroup === "main")} renderHabit={renderHabit} />
        {plans.map((plan) => {
          const planHabits = list.filter((h) => h.source === "ai" && String(h.aiPlanId || "") === String(plan._id));
          if (!planHabits.length) return null;
          return <HabitGroup key={plan._id} title={plan.title} eyebrow={plan.source === "uploaded_roadmap" ? "Roadmap habits" : "AI-generated habits"} habits={planHabits} renderHabit={renderHabit} />;
        })}
        <HabitGroup title="Other habits" eyebrow="Supporting routines" habits={list.filter((h) => h.source !== "ai" && h.trackGroup === "other")} renderHabit={renderHabit} />
        <HabitGroup title="Unassigned AI habits" eyebrow="Needs a plan link" habits={list.filter((h) => h.source === "ai" && !plans.some((p) => String(p._id) === String(h.aiPlanId || "")))} renderHabit={renderHabit} />
      </div>}

      {form && (

        <div className="fixed inset-0 bg-transparent flex items-end md:items-center justify-center z-40 px-4" onClick={() => setForm(null)}>
          <form onSubmit={save} className="bg-bgTop border border-border rounded-2xl w-full max-w-sm p-5 mb-4 md:mb-0 max-h-[85vh] overflow-y-auto scrollbar-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold">{form.id ? "Edit habit" : "New habit"}</p>
              <button type="button" onClick={() => setForm(null)}><X size={18} className="text-textMuted" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <input required placeholder="Habit name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-cream" />
              <input placeholder="Category (e.g. Health)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-cream" />

              <div>
                <p className="text-xs text-textMuted mb-1.5">Icon</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICON_NAMES.map((name) => {
                    const I = getIcon(name);
                    return (
                      <button type="button" key={name} onClick={() => setForm({ ...form, icon: name })}
                        className="aspect-square rounded-lg flex items-center justify-center"
                        style={{ background: form.icon === name ? `${form.color}33` : "rgb(var(--bg))", border: form.icon === name ? `1px solid ${form.color}` : "1px solid transparent" }}>
                        <I size={15} color={form.icon === name ? form.color : "rgb(var(--text-muted))"} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-textMuted mb-1.5">Color</p>
                <div className="flex gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                      className="w-7 h-7 rounded-full" style={{ background: c, outline: form.color === c ? "2px solid rgb(var(--text-primary))" : "none", outlineOffset: 2 }} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-textMuted mb-1.5">Daily role</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm({ ...form, trackGroup: "main" })} className={`rounded-xl border px-3 py-2 text-xs text-left ${form.trackGroup !== "other" ? "border-cream bg-cream/10" : "border-border"}`}><b>Main goal</b><span className="block text-[9px] text-textMuted mt-0.5">Show on today's priority list</span></button>
                  <button type="button" onClick={() => setForm({ ...form, trackGroup: "other" })} className={`rounded-xl border px-3 py-2 text-xs text-left ${form.trackGroup === "other" ? "border-cream bg-cream/10" : "border-border"}`}><b>Other</b><span className="block text-[9px] text-textMuted mt-0.5">Keep it supporting</span></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-textMuted mb-1.5">Frequency</p>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-textMuted mb-1.5">Reminder</p>
                  <input type="time" value={form.reminderTime} onChange={(e) => setForm({ ...form, reminderTime: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>

              <button className="w-full bg-cream text-bg font-semibold py-3 rounded-xl mt-2">
                {saving ? <ButtonSpinner /> : (form.id ? "Save changes" : "Create habit")}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-bgTop border border-border rounded-2xl w-full max-w-xs p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold mb-1">Delete "{confirmDelete.name}"?</p>
            <p className="text-xs text-textMuted mb-4">This removes all its history too. This can't be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm">Cancel</button>
              <button onClick={() => remove(confirmDelete.id)} disabled={deleting} className="flex-1 bg-pink text-[#3A2530] font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60">
  {deleting ? <ButtonSpinner label="Deleting…" /> : "Delete"}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HabitGroup({ title, eyebrow, habits, renderHabit }) {
  if (!habits.length) return null;
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-3">
        <div><p className="eyebrow">{eyebrow}</p><h2 className="font-display text-xl font-semibold mt-1">{title}</h2></div>
        <span className="text-[10px] text-textMuted">{habits.length} habit{habits.length === 1 ? "" : "s"}</span>
      </div>
      <div className="flex flex-col gap-2.5">{habits.map(renderHabit)}</div>
    </section>
  );
}
