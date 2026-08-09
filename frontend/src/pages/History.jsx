import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Snowflake, X } from "lucide-react";
import api from "../lib/api.js";
import { getIcon } from "../lib/icons.js";
import { todayISO } from "../lib/date.js";
import PageLoader from "../components/PageLoader.jsx";

function monthMeta(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay();
  return { daysInMonth, startWeekday };
}

function pad(n) { return String(n).padStart(2, "0"); }
function iso(year, month, day) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

export default function History() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [habits, setHabits] = useState([]);
  const [filterId, setFilterId] = useState("all");
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const today = todayISO();

  useEffect(() => {
    api.get("/habits")
      .then((r) => setHabits(r.data.habits.filter((h) => !h.archived)));
  }, []);

  const { daysInMonth, startWeekday } = monthMeta(year, month);
  const from = iso(year, month, 1);
  const to = iso(year, month, daysInMonth);

  useEffect(() => {
    setLoading(true);
    api.get("/checkins", { params: { from, to } })
      .then((r) => setCheckins(r.data.checkins))
      .finally(() => setLoading(false));
  }, [year, month]);

  const activeHabits = filterId === "all" ? habits : habits.filter((h) => h.id === filterId);

  const dayStats = useMemo(() => {
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = iso(year, month, d);
      const relevant = checkins.filter((c) =>
        c.date === date &&
        (filterId === "all" || String(c.habitId || c.habit_id) === String(filterId))
      );
      const doneIds = new Set(relevant.map((c) => String(c.habitId || c.habit_id)));
      map[date] = {
        doneCount: doneIds.size,
        total: activeHabits.length,
        missed: date < today && activeHabits.some((h) =>
          !doneIds.has(String(h.id)) && (h.startDate || h.start_date) <= date
        ),
      };
    }
    return map;
  }, [checkins, activeHabits, year, month]);

  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; } else if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const applyFreeze = async (habitId, date) => {
    setActionKey(`freeze-${habitId}-${date}`);
    try {
      await api.post(`/habits/${habitId}/freeze`, { date });
      const r = await api.get("/checkins", { params: { from, to } });
      setCheckins(r.data.checkins);
    } finally {
      setActionKey(null);
    }
  };

  const correctCheckin = async (habitId, date, shouldBeDone) => {
    setActionKey(`correct-${habitId}-${date}`);
    try {
      if (shouldBeDone) {
        await api.post("/checkins/toggle", { habitId, date });
      } else {
        await api.delete(`/checkins/${habitId}/${date}`);
      }

      const r = await api.get("/checkins", { params: { from, to } });
      setCheckins(r.data.checkins);
    } catch (err) {
      window.alert(err.response?.data?.error || "Could not update this check-in.");
    } finally {
      setActionKey(null);
    }
  };

  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  if (loading) return <PageLoader label="Loading your history…" />;

  const selected = selectedDay
    ? {
        date: selectedDay,
        habits: habits.map((h) => ({
          ...h,
          done: checkins.some((c) =>
            c.date === selectedDay &&
            String(c.habitId || c.habit_id) === String(h.id)
          ),
        })),
      }
    : null;

  return (
    <div className="max-w-md md:max-w-2xl mx-auto">
      <h1 className="font-display text-xl font-bold mb-1">History</h1>
      <p className="text-textMuted text-sm mb-5">
        Tap a day to see details. Use <span className="text-cream font-semibold">Correct</span> here if you accidentally marked a habit complete.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <select
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-xs flex-1"
        >
          <option value="all">All habits</option>
          {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-surfaceRaised"><ChevronLeft size={18} /></button>
          <p className="font-display font-semibold text-sm">{new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-surfaceRaised"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {weekdayLabels.map((w, i) => <div key={i} className="text-[10px] text-textMuted text-center">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const date = iso(year, month, d);
            const stat = dayStats[date];
            const intensity = stat && stat.total > 0 ? stat.doneCount / stat.total : 0;
            const isToday = date === today;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(date)}
                className="aspect-square rounded-lg flex items-center justify-center text-[11px] relative"
                style={{
                  background: intensity > 0 ? `rgb(var(--cream) / ${0.15 + intensity * 0.55})` : "rgb(var(--surface))",
                  border: isToday ? "1px solid rgb(var(--cream))" : "1px solid transparent",
                  color: intensity > 0.5 ? "rgb(var(--bg))" : "rgb(var(--text-secondary))",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-transparent flex items-end md:items-center justify-center z-40 px-4" onClick={() => setSelectedDay(null)}>
          <div className="bg-bgTop border border-border rounded-2xl w-full max-w-sm p-5 mb-4 md:mb-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display font-semibold">{new Date(selected.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</p>
              <button onClick={() => setSelectedDay(null)}><X size={18} className="text-textMuted" /></button>
            </div>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {selected.habits.map((h) => {
                const Icon = getIcon(h.icon);
                const isPast = selected.date < today;
                return (
                  <div key={h.id} className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3 py-2.5">
                    <Icon size={15} color={h.color} />
                    <span className="text-xs flex-1">{h.name}</span>
                    {h.done ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-teal">Done</span>
                        <button
                          onClick={() => correctCheckin(h.id, selected.date, false)}
                          disabled={!!actionKey}
                          className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50"
                        >
                          {actionKey === `correct-${h.id}-${selected.date}` ? "Saving…" : "Correct"}
                        </button>
                      </div>
                    ) : isPast ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => correctCheckin(h.id, selected.date, true)}
                          className="text-[10px] font-semibold text-teal hover:text-cream"
                        >
                          Mark done
                        </button>
                        <button
                          onClick={() => applyFreeze(h.id, selected.date)}
                          disabled={h.freeze_passes_remaining <= 0}
                          className="flex items-center gap-1 text-[10px] font-semibold text-cream disabled:opacity-40"
                        >
                          <Snowflake size={11} /> Freeze
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => correctCheckin(h.id, selected.date, true)}
                        className="text-[10px] font-semibold text-teal hover:text-cream"
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
