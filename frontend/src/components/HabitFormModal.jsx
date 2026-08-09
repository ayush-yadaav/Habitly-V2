// import React, { useState } from "react";
// import { X } from "lucide-react";
// import api from "../lib/api.js";
// import { getIcon, ICON_NAMES, CATEGORY_COLORS } from "../lib/icons.js";
// import { todayISO } from "../lib/date.js";
// import ButtonSpinner from "./ButtonSpinner.jsx";

// const EMPTY = {
//   name: "", category: "General", icon: "Sparkles", color: CATEGORY_COLORS[0],
//   frequency: "daily", startDate: todayISO(), reminderTime: "", trackGroup: "main",
// };

// export default function HabitFormModal({ onClose, onSaved }) {
//   const [form, setForm] = useState({ ...EMPTY });
//   const [saving, setSaving] = useState(false);

//   async function save(e) {
//     e.preventDefault();
//     setSaving(true);
//     try {
//       await api.post("/habits", form);
//       onSaved?.();
//       onClose();
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center  px-3 sm:px-4" onClick={onClose}>
//       <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-bgTop border border-border rounded-[24px] w-full max-w-md p-5 sm:p-6 mb-2 sm:mb-0 max-h-[88vh] overflow-y-auto shadow-2xl fade-in">
//         <div className="flex items-start justify-between gap-4 mb-5">
//           <div>
//             <p className="eyebrow">Create</p>
//             <h2 className="font-display text-2xl font-semibold mt-1">New habit</h2>
//             <p className="text-xs text-textMuted mt-1">Add one simple behavior to your daily system.</p>
//           </div>
//           <button type="button" onClick={onClose} className="icon-button"><X size={16} /></button>
//         </div>

//         <div className="flex flex-col gap-4">
//           <label className="text-xs font-semibold">Name
//             <input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Read 20 pages" className="field-control" />
//           </label>
//           <label className="text-xs font-semibold">Category
//             <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Learning, Health, Personal…" className="field-control" />
//           </label>

//           <div>
//             <p className="text-xs font-semibold mb-2">Icon</p>
//             <div className="grid grid-cols-8 gap-1.5">
//               {ICON_NAMES.map((name) => {
//                 const I = getIcon(name);
//                 const active = form.icon === name;
//                 return <button type="button" key={name} onClick={() => setForm({ ...form, icon: name })} className="aspect-square rounded-xl flex items-center justify-center" style={{ background: active ? `${form.color}24` : "rgb(var(--bg))", border: active ? `1px solid ${form.color}` : "1px solid rgb(var(--border))" }}><I size={15} color={active ? form.color : "rgb(var(--text-muted))"} /></button>;
//               })}
//             </div>
//           </div>

//           <div>
//             <p className="text-xs font-semibold mb-2">Accent</p>
//             <div className="flex gap-2">
//               {CATEGORY_COLORS.map((c) => <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className="w-8 h-8 rounded-full" style={{ background: c, outline: form.color === c ? "2px solid rgb(var(--text-primary))" : "none", outlineOffset: 2 }} />)}
//             </div>
//           </div>

//           <div>
//             <p className="text-xs font-semibold mb-2">Where should it appear?</p>
//             <div className="grid grid-cols-2 gap-2">
//               <button type="button" onClick={() => setForm({ ...form, trackGroup: "main" })} className={`choice-card ${form.trackGroup === "main" ? "choice-active" : ""}`}><b className="text-xs">Daily main goal</b><span className="block text-[10px] text-textMuted mt-1">Your priority routine.</span></button>
//               <button type="button" onClick={() => setForm({ ...form, trackGroup: "other" })} className={`choice-card ${form.trackGroup === "other" ? "choice-active" : ""}`}><b className="text-xs">Other habits</b><span className="block text-[10px] text-textMuted mt-1">Useful, but not priority.</span></button>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <label className="text-xs font-semibold">Frequency
//               <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="field-control">
//                 <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="custom">Custom</option>
//               </select>
//             </label>
//             <label className="text-xs font-semibold">Reminder
//               <input type="time" value={form.reminderTime} onChange={(e) => setForm({ ...form, reminderTime: e.target.value })} className="field-control" />
//             </label>
//           </div>

//           <button disabled={saving} className="primary-button w-full mt-1 py-3">{saving ? <ButtonSpinner label="Creating…" /> : "Create habit"}</button>
//         </div>
//       </form>
//     </div>
//   );
// }


import React, { useState } from "react";
import { X } from "lucide-react";
import api from "../lib/api.js";
import {
  getIcon,
  ICON_NAMES,
  CATEGORY_COLORS,
} from "../lib/icons.js";
import { todayISO } from "../lib/date.js";
import ButtonSpinner from "./ButtonSpinner.jsx";

const EMPTY = {
  name: "",
  category: "General",
  icon: "Sparkles",
  color: CATEGORY_COLORS[0],
  frequency: "daily",
  startDate: todayISO(),
  reminderTime: "",
  trackGroup: "main",
};

export default function HabitFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post("/habits", form);
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        pointer-events-none
      "
    >
      {/* =========================
          CREATE PANEL
      ========================== */}
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="
          pointer-events-auto

          absolute
          right-5
          top-20

          w-[min(420px,calc(100vw-2rem))]

          max-h-[calc(100vh-6rem)]

          overflow-y-auto

          bg-bgTop
          border
          border-border

          rounded-[28px]

          p-6

          shadow-[0_20px_70px_rgba(0,0,0,0.18)]

          fade-in

          scrollbar-none
        "
      >
        {/* =========================
            HEADER
        ========================== */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow">
              Create
            </p>

            <h2 className="font-display text-3xl font-semibold mt-1">
              New habit
            </h2>

            <p className="text-sm text-textMuted mt-1 leading-relaxed">
              Add one simple behavior to your daily system.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              shrink-0

              w-9
              h-9

              rounded-full

              border
              border-border

              flex
              items-center
              justify-center

              text-textMuted

              hover:text-textPrimary
              hover:bg-surfaceRaised

              transition
            "
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* =========================
            FORM
        ========================== */}
        <div className="flex flex-col gap-5">

          {/* NAME */}
          <label className="text-xs font-semibold">
            Name

            <input
              required
              autoFocus
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="e.g. Read 20 pages"
              className="field-control"
            />
          </label>

          {/* CATEGORY */}
          <label className="text-xs font-semibold">
            Category

            <input
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              placeholder="Learning, Health, Personal…"
              className="field-control"
            />
          </label>

          {/* ICON */}
          <div>
            <p className="text-xs font-semibold mb-2">
              Icon
            </p>

            <div className="grid grid-cols-8 gap-1.5">
              {ICON_NAMES.map((name) => {
                const I = getIcon(name);
                const active = form.icon === name;

                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() =>
                      setForm({
                        ...form,
                        icon: name,
                      })
                    }
                    className="
                      aspect-square
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      transition
                      hover:scale-105
                    "
                    style={{
                      background: active
                        ? `${form.color}24`
                        : "rgb(var(--bg))",

                      border: active
                        ? `1px solid ${form.color}`
                        : "1px solid rgb(var(--border))",
                    }}
                  >
                    <I
                      size={15}
                      color={
                        active
                          ? form.color
                          : "rgb(var(--text-muted))"
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACCENT */}
          <div>
            <p className="text-xs font-semibold mb-2">
              Accent
            </p>

            <div className="flex gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() =>
                    setForm({
                      ...form,
                      color: c,
                    })
                  }
                  className="
                    w-8
                    h-8
                    rounded-full
                    transition
                    hover:scale-110
                  "
                  style={{
                    background: c,

                    outline:
                      form.color === c
                        ? "2px solid rgb(var(--text-primary))"
                        : "none",

                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* WHERE SHOULD IT APPEAR */}
          <div>
            <p className="text-xs font-semibold mb-2">
              Where should it appear?
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    trackGroup: "main",
                  })
                }
                className={`choice-card ${
                  form.trackGroup === "main"
                    ? "choice-active"
                    : ""
                }`}
              >
                <b className="text-xs">
                  Daily main goal
                </b>

                <span className="block text-[10px] text-textMuted mt-1">
                  Your priority routine.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    trackGroup: "other",
                  })
                }
                className={`choice-card ${
                  form.trackGroup === "other"
                    ? "choice-active"
                    : ""
                }`}
              >
                <b className="text-xs">
                  Other habits
                </b>

                <span className="block text-[10px] text-textMuted mt-1">
                  Useful, but not priority.
                </span>
              </button>
            </div>
          </div>

          {/* FREQUENCY + REMINDER */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold">
              Frequency

              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    frequency: e.target.value,
                  })
                }
                className="field-control"
              >
                <option value="daily">
                  Daily
                </option>

                <option value="weekly">
                  Weekly
                </option>

                <option value="custom">
                  Custom
                </option>
              </select>
            </label>

            <label className="text-xs font-semibold">
              Reminder

              <input
                type="time"
                value={form.reminderTime}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reminderTime: e.target.value,
                  })
                }
                className="field-control"
              />
            </label>
          </div>

          {/* CREATE */}
          <button
            disabled={saving}
            className="primary-button w-full py-3"
          >
            {saving ? (
              <ButtonSpinner label="Creating…" />
            ) : (
              "Create habit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}