import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Lightbulb,
  Sparkles,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import api from "../lib/api.js";
import { todayISO, formatDate } from "../lib/date.js";
import PageLoader from "../components/PageLoader.jsx";
import ButtonSpinner from "../components/ButtonSpinner.jsx";

const MOODS = [
  { value: "😊", label: "Great" },
  { value: "🙂", label: "Good" },
  { value: "😐", label: "Okay" },
  { value: "😔", label: "Low" },
  { value: "😤", label: "Rough" },
];

const TAGS = ["Learning", "Health", "Work", "Personal", "Family", "Mindset"];

function daysBetween(a, b) {
  return Math.round(
    (new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`)) / 86400000
  );
}

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(3);
  const [gratitude, setGratitude] = useState("");
  const [win, setWin] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState("");
  const [showPast, setShowPast] = useState(false);

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/journal");
      setEntries(res.data.entries || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!todayEntry) return;
    setNote(todayEntry.note || "");
    setMood(todayEntry.mood || null);
    setEnergy(todayEntry.energy || 3);
    setGratitude(todayEntry.gratitude || "");
    setWin(todayEntry.win || "");
    setTomorrow(todayEntry.tomorrow || "");
    setTags(todayEntry.tags || []);
  }, [todayEntry?.id]);

  const reflectionStreak = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date));
    let streak = 0;
    let cursor = today;

    while (dates.has(cursor)) {
      streak += 1;
      const d = new Date(`${cursor}T00:00:00`);
      d.setDate(d.getDate() - 1);
      cursor = todayISO(d);
    }

    return streak;
  }, [entries, today]);

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const completion = [
    note.trim(),
    mood,
    gratitude.trim(),
    win.trim(),
    tomorrow.trim(),
  ].filter(Boolean).length;

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
          ? [...prev, tag]
          : prev
    );
  };

  const save = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setMessage("Write at least one honest line first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await api.post("/journal", {
        date: today,
        note,
        mood,
        energy,
        gratitude,
        win,
        tomorrow,
        tags,
      });

      setEntries((prev) => {
        const rest = prev.filter((entry) => entry.date !== today);
        return [res.data.entry, ...rest].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      });

      setMessage("Reflection saved ✓");
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not save your reflection.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/journal/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id && e._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <PageLoader label="Opening your journal…" />;

  const pastEntries = entries.filter((e) => e.date !== today);

  return (
    <div className="max-w-md md:max-w-3xl mx-auto pb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={19} className="text-cream" />
            <h1 className="font-display text-xl font-bold">Journal</h1>
          </div>
          <p className="text-textMuted text-sm mt-1">
            Turn today into something you can learn from.
          </p>
        </div>

        <div className="shrink-0 bg-surface border border-border rounded-2xl px-3 py-2 text-center">
          <div className="flex items-center gap-1 justify-center text-yellow">
            <Flame size={13} />
            <span className="text-sm font-bold">{reflectionStreak}</span>
          </div>
          <p className="text-[9px] text-textMuted mt-0.5">day reflection</p>
        </div>
      </div>

      <form
        onSubmit={save}
        className="bg-surface border border-border rounded-2xl overflow-hidden mb-6"
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-textMuted">{formatDate(today)}</p>
              <p className="font-display font-semibold mt-0.5">
                Your daily reset
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-cream">{completion}/5</p>
              <p className="text-[10px] text-textMuted">reflection complete</p>
            </div>
          </div>

          <label className="text-xs font-semibold text-textSecondary">
            How are you feeling?
          </label>
          <div className="flex gap-2 mt-2">
            {MOODS.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setMood(item.value)}
                title={item.label}
                className={`flex-1 py-2.5 rounded-xl border transition ${
                  mood === item.value
                    ? "border-cream bg-cream/10"
                    : "border-border bg-bg hover:bg-surfaceRaised"
                }`}
              >
                <span className="text-xl">{item.value}</span>
                <span className="block text-[9px] text-textMuted mt-0.5">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-textSecondary">
                Energy today
              </label>
              <span className="text-xs text-cream font-semibold">
                {energy}/5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-cream"
            />
            <div className="flex justify-between text-[9px] text-textMuted mt-1">
              <span>Drained</span>
              <span>Balanced</span>
              <span>Charged</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-textSecondary">
                The honest version
              </label>
              <span className="text-[10px] text-textMuted">{wordCount} words</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What actually happened today? No need to make it sound perfect."
              rows={5}
              maxLength={1500}
              className="w-full bg-bg border border-border rounded-xl p-3.5 outline-none text-sm leading-relaxed resize-none placeholder:text-textMuted focus:border-cream/70"
            />
          </div>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div className="bg-bg border border-border rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={15} className="text-pink" />
              <label className="text-xs font-semibold">One thing I'm grateful for</label>
            </div>
            <input
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="A person, moment, opportunity…"
              className="w-full bg-transparent outline-none text-xs placeholder:text-textMuted"
            />
          </div>

          <div className="bg-bg border border-border rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-yellow" />
              <label className="text-xs font-semibold">Today's small win</label>
            </div>
            <input
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder="What are you proud of?"
              className="w-full bg-transparent outline-none text-xs placeholder:text-textMuted"
            />
          </div>

          <div className="bg-bg border border-border rounded-xl p-3.5 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Target size={15} className="text-teal" />
              <label className="text-xs font-semibold">Tomorrow's intention</label>
            </div>
            <input
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              placeholder="The one thing that would make tomorrow a good day…"
              className="w-full bg-transparent outline-none text-xs placeholder:text-textMuted"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-cream" />
              <p className="text-xs font-semibold">Tag your day <span className="text-textMuted font-normal">(up to 3)</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-[10px] border transition ${
                    tags.includes(tag)
                      ? "border-cream bg-cream/10 text-cream"
                      : "border-border text-textMuted hover:bg-surfaceRaised"
                  }`}
                >
                  {tags.includes(tag) && <Check size={10} className="inline mr-1" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
          <p className="text-xs text-teal min-h-4">{message}</p>
          <button
            disabled={saving}
            className="bg-cream text-bg text-xs font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60 min-w-[105px]"
          >
            {saving ? <ButtonSpinner /> : todayEntry ? "Update reflection" : "Save reflection"}
          </button>
        </div>
      </form>

      {todayEntry && (
        <div className="mb-6 bg-cream/5 border border-cream/15 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} className="text-cream" />
            <p className="text-xs font-semibold">Your tomorrow card</p>
          </div>
          <p className="text-sm text-textSecondary">
            {tomorrow || "You haven't set an intention yet. Add one above."}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPast((v) => !v)}
        className="w-full flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm font-semibold"
      >
        <span>Past reflections <span className="text-textMuted font-normal">({pastEntries.length})</span></span>
        {showPast ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {showPast && (
        <div className="flex flex-col gap-3 mt-3">
          {pastEntries.length === 0 ? (
            <p className="text-sm text-textMuted text-center py-8">
              Your reflection history will appear here.
            </p>
          ) : (
            pastEntries.map((e) => (
              <article key={e.id || e._id} className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs text-textMuted">
                      {formatDate(e.date)} {e.mood && <span className="ml-1">{e.mood}</span>}
                      {e.energy && <span className="ml-2">Energy {e.energy}/5</span>}
                    </p>
                    {e.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {e.tags.map((tag) => (
                          <span key={tag} className="text-[9px] px-2 py-1 rounded-full bg-surfaceRaised text-textMuted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(e.id || e._id)}
                    disabled={deleting === (e.id || e._id)}
                    aria-label="Delete entry"
                    className="p-1.5 rounded-lg hover:bg-surfaceRaised text-textMuted disabled:opacity-50"
                  >
                    {deleting === (e.id || e._id) ? (
                      <span className="block w-3.5 h-3.5 border-2 border-textMuted border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                <p className="text-sm leading-relaxed">{e.note}</p>

                {e.gratitude && (
                  <p className="text-xs text-textMuted mt-3">
                    <span className="text-pink">Grateful:</span> {e.gratitude}
                  </p>
                )}
                {e.win && (
                  <p className="text-xs text-textMuted mt-1">
                    <span className="text-yellow">Win:</span> {e.win}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
