import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame } from "lucide-react";
import { getIcon } from "../lib/icons.js";

function Confetti({ color }) {
  const particles = Array.from({ length: 7 }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
    const dist = 26 + Math.random() * 16;
    return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, key: i };
  });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <motion.span
          key={p.key}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.tx, y: p.ty, scale: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: 5, height: 5, borderRadius: "50%", background: color,
          }}
        />
      ))}
    </div>
  );
}

export default function HabitCard({ habit, done, onToggle, index = 0 }) {
  const [burst, setBurst] = useState(false);
  const Icon = getIcon(habit.icon);

  const handleClick = () => {
    if (done) return;
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
    onToggle(habit.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: done ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3"
    >
      <div className="w-1 self-stretch rounded" style={{ background: habit.color }} />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${habit.color}22` }}
      >
        <Icon size={18} color={habit.color} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${done ? "line-through text-textMuted" : "text-textPrimary"}`}>
          {habit.name}
        </p>
        <p className="text-xs text-textMuted flex items-center gap-1 mt-0.5">
          <Flame size={11} /> {habit.currentStreak}d streak · {habit.category}
        </p>
        {done && <p className="text-[10px] font-semibold text-cream mt-1">Completed today · edit in History</p>}
      </div>
      <div className="relative shrink-0">
        <AnimatePresence>{burst && <Confetti color={habit.color} />}</AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.85 }}
          animate={{ scale: burst ? 1.25 : 1 }}
          onClick={handleClick}
          aria-label={done ? "Completed today. Use History to make a correction." : "Mark as done"}
          disabled={done}
          title={done ? "Completed today — use History to make a correction" : "Complete today's habit"}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? "cursor-default" : "cursor-pointer"}`}
          style={{
            background: done ? habit.color : "transparent",
            border: done ? "none" : "1.5px solid rgb(var(--border))",
          }}
        >
          {done && <Check size={16} color="rgb(var(--bg))" strokeWidth={3} />}
        </motion.button>
      </div>
    </motion.div>
  );
}
