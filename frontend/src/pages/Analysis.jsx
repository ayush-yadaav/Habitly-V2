import React, { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import api from "../lib/api.js";
import PageLoader from "../components/PageLoader.jsx";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs text-textMuted mb-1">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-textMuted mt-1">{sub}</p>}
    </div>
  );
}

export default function Analysis() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get("/analysis/summary", { params: { days: range } })
      .then((r) => {
        if (alive) setData(r.data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [range]);

  if (loading || !data) return <PageLoader label="Crunching your numbers…" />;

  const delta = data.overallCompletion - data.previousCompletion;

  return (
    <div className="max-w-md md:max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-xl font-bold">Analysis</h1>
        <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      <p className="text-textMuted text-sm mb-5">How you're actually doing, not just how it feels.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Completion" value={`${data.overallCompletion}%`} sub={`${data.totalCompleted} completed`} />
        <StatCard
          label="vs previous period"
          value={<span className="flex items-center gap-1">{delta >= 0 ? <ArrowUpRight size={18} className="text-teal" /> : <ArrowDownRight size={18} className="text-pink" />}{Math.abs(delta)}%</span>}
        />
        <StatCard label="Best habit" value={data.bestHabit ? `${data.bestHabit.completion}%` : "—"} sub={data.bestHabit?.name} />
        <StatCard label="Needs work" value={data.worstHabit ? `${data.worstHabit.completion}%` : "—"} sub={data.worstHabit?.name} />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <p className="text-sm font-semibold mb-3">Daily completion</p>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={data.dailySeries}>
              <defs>
                <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--cream))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="rgb(var(--cream))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} tickFormatter={(d) => d.slice(5)} interval={Math.ceil(data.dailySeries.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} width={30} />
              <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="percent" stroke="rgb(var(--cream))" fill="url(#fillArea)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-3">Habit-wise performance</p>
          <div className="flex flex-col gap-2.5">
            {data.byHabit.map((h) => (
              <div key={h.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{h.name}</span>
                  <span className="text-textMuted">{h.completion}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${h.completion}%`, background: h.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-3">Consistency by day of week</p>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={data.byWeekday}>
                <CartesianGrid stroke="rgb(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} />
                <YAxis tick={{ fontSize: 10, fill: "rgb(var(--text-muted))" }} width={30} />
                <Tooltip contentStyle={{ background: "rgb(var(--surface))", border: "1px solid rgb(var(--border))", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="completion" fill="rgb(var(--lavender))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
