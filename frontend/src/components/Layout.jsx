// import React from "react";
// import { NavLink, Outlet } from "react-router-dom";
// import { Home, Flame, CalendarDays, BarChart3, Settings2, BookText, User, BrainCircuit, Sun, Moon } from "lucide-react";
// import { useTheme } from "../context/ThemeContext.jsx";

// const navItems = [
//   { to: "/", icon: Home, label: "Today", end: true },
//   { to: "/habits", icon: Settings2, label: "Habits" },
//   { to: "/ai", icon: BrainCircuit, label: "AI Planner" },
//   { to: "/streaks", icon: Flame, label: "Streaks" },
//   { to: "/history", icon: CalendarDays, label: "History" },
//   { to: "/analysis", icon: BarChart3, label: "Insights" },
//   { to: "/journal", icon: BookText, label: "Journal" },
//   { to: "/profile", icon: User, label: "Profile" },
// ];

// const mobileItems = navItems.filter((i) => ["Today", "Habits", "AI Planner", "Streaks", "Journal"].includes(i.label));

// export default function Layout() {
//   const { theme, toggleTheme } = useTheme();
//   return (
//     <div className="min-h-screen bg-bg text-textPrimary flex">
//       <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-border bg-bgTop min-h-screen px-5 py-7 sticky top-0 h-screen">
//         <div className="px-2 mb-10">
//           <div className="flex items-end gap-2">
//             <span className="font-display text-2xl font-semibold tracking-tight">Habitly</span>
//             <span className="text-[9px] uppercase tracking-[0.28em] text-textMuted mb-1">daily systems</span>
//           </div>
//         </div>

//         <p className="px-2 text-[9px] uppercase tracking-[0.24em] text-textMuted mb-3">Workspace</p>
//         <nav className="flex flex-col gap-1">
//           {navItems.slice(0, 3).map((item) => <NavItem key={item.to} item={item} />)}
//         </nav>
//         <p className="px-2 text-[9px] uppercase tracking-[0.24em] text-textMuted mt-7 mb-3">Progress</p>
//         <nav className="flex flex-col gap-1">
//           {navItems.slice(3, 6).map((item) => <NavItem key={item.to} item={item} />)}
//         </nav>
//         <p className="px-2 text-[9px] uppercase tracking-[0.24em] text-textMuted mt-7 mb-3">Personal</p>
//         <nav className="flex flex-col gap-1">
//           {navItems.slice(6).map((item) => <NavItem key={item.to} item={item} />)}
//         </nav>

//         <div className="mt-auto px-2 flex items-center justify-between gap-3">
//           <div>
//             <p className="text-[10px] text-textMuted">Theme</p>
//             <p className="text-xs font-semibold capitalize">{theme}</p>
//           </div>
//           <button onClick={toggleTheme} className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center hover:bg-surfaceRaised transition" aria-label="Toggle theme">
//             {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
//           </button>
//         </div>
//       </aside>

//       <div className="flex-1 flex flex-col min-w-0">
//         <header className="md:hidden flex items-center justify-between px-5 pt-6 pb-3 bg-bg sticky top-0 z-20">
//           <div>
//             <span className="font-display text-xl font-semibold">Habitly</span>
//             <span className="block text-[8px] uppercase tracking-[0.24em] text-textMuted">daily systems</span>
//           </div>
//           <button onClick={toggleTheme} className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center">
//             {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
//           </button>
//         </header>

//         <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-9 pb-28 md:pb-12 pt-3 md:pt-10">
//           <Outlet />
//         </main>
//       </div>

//       <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bgTop border-t border-border flex justify-around py-2.5 pb-4 z-30">
//         {mobileItems.map((item) => (
//           <NavItem key={item.to} item={item} mobile />
//         ))}
//       </nav>
//     </div>
//   );
// }

// function NavItem({ item, mobile = false }) {
//   return (
//     <NavLink
//       to={item.to}
//       end={item.end}
//       className={({ isActive }) => mobile
//         ? `flex flex-col items-center gap-1 px-2 ${isActive ? "text-cream" : "text-textMuted"}`
//         : `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive ? "bg-surfaceRaised text-cream" : "text-textSecondary hover:bg-surface hover:text-textPrimary"}`}
//     >
//       <item.icon size={mobile ? 18 : 17} strokeWidth={1.8} />
//       <span className={mobile ? "text-[9px] font-semibold" : "font-medium"}>{item.label}</span>
//     </NavLink>
//   );
// }

import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Home,
  Flame,
  CalendarDays,
  BarChart3,
  Settings2,
  BookText,
  User,
  BrainCircuit,
  Sun,
  Moon,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const navItems = [
  { to: "/", icon: Home, label: "Today", end: true },
  { to: "/habits", icon: Settings2, label: "Habits" },
  { to: "/ai", icon: BrainCircuit, label: "AI Planner" },
  { to: "/streaks", icon: Flame, label: "Streaks" },
  { to: "/history", icon: CalendarDays, label: "History" },
  { to: "/analysis", icon: BarChart3, label: "Insights" },
  { to: "/journal", icon: BookText, label: "Journal" },
  { to: "/profile", icon: User, label: "Profile" },
];

const mobileItems = navItems.filter((item) =>
  ["Today", "Habits", "AI Planner", "Streaks"].includes(item.label)
);

const moreItems = navItems.filter((item) =>
  ["History", "Insights", "Journal", "Profile"].includes(item.label)
);

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-textPrimary flex">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-bgTop min-h-screen px-5 py-7 sticky top-0 h-screen flex-col">
        {/* Logo */}
        <div className="px-2 mb-10">
          <div className="font-display text-2xl font-semibold">
            Habitly
          </div>

          <div className="text-[9px] uppercase tracking-[0.24em] text-textMuted mt-0.5">
            daily systems
          </div>
        </div>

        {/* Workspace */}
        <p className="px-2 text-[9px] uppercase tracking-[0.24em] text-textMuted mb-3">
          Workspace
        </p>

        <nav className="flex flex-col gap-1">
          {navItems.slice(0, 3).map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Progress */}
        <p className="px-2 text-[9px] uppercase tracking-[0.24em] text-textMuted mt-7 mb-3">
          Progress
        </p>

        <nav className="flex flex-col gap-1">
          {navItems.slice(3, 6).map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Personal */}
        <p className="px-2 text-[9px] uppercase tracking-[0.24em] text-textMuted mt-7 mb-3">
          Personal
        </p>

        <nav className="flex flex-col gap-1">
          {navItems.slice(6).map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Theme */}
        <div className="mt-auto px-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-textMuted">Theme</p>
            <p className="text-xs font-semibold capitalize">
              {theme}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center hover:bg-surfaceRaised transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={15} />
            ) : (
              <Sun size={15} />
            )}
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-5 pt-5 pb-3 bg-bg sticky top-0 z-20">
          <div>
            <span className="font-display text-xl font-semibold">
              Habitly
            </span>

            <span className="block text-[8px] uppercase tracking-[0.24em] text-textMuted">
              daily systems
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center active:scale-95 transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={15} />
            ) : (
              <Sun size={15} />
            )}
          </button>
        </header>

        {/* Page */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-5 md:px-9 pb-28 md:pb-12 pt-3 md:pt-10">
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE MORE MENU ================= */}
      {showMore && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setShowMore(false)}
            className="md:hidden fixed inset-0 bg-black/20 z-40"
          />

          {/* Bottom Sheet */}
          <div className="md:hidden fixed left-3 right-3 bottom-[82px] z-50 bg-bgTop border border-border rounded-2xl shadow-2xl p-3">
            <div className="flex items-center justify-between px-2 pb-2">
              <div>
                <p className="text-sm font-semibold">More</p>
                <p className="text-[10px] text-textMuted">
                  Everything else in Habitly
                </p>
              </div>

              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-textMuted hover:text-textPrimary hover:bg-surface transition"
                aria-label="Close menu"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  mobileMore
                  onNavigate={() => setShowMore(false)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bgTop/95 border-t border-border z-30 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              mobile
            />
          ))}

          {/* More */}
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[52px] py-1 ${
              showMore
                ? "text-cream"
                : "text-textMuted"
            }`}
          >
            <MoreHorizontal
              size={19}
              strokeWidth={1.8}
            />

            <span className="text-[9px] font-semibold">
              More
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

/* ================= NAV ITEM ================= */

function NavItem({
  item,
  mobile = false,
  mobileMore = false,
  onNavigate,
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => {
        if (mobileMore) {
          return `
            flex items-center gap-3
            px-3 py-3
            rounded-xl
            border border-border
            transition
            ${
              isActive
                ? "bg-surfaceRaised text-cream border-cream/30"
                : "bg-surface text-textSecondary hover:bg-surfaceRaised hover:text-textPrimary"
            }
          `;
        }

        if (mobile) {
          return `
            flex flex-col items-center justify-center
            gap-1 min-w-[52px] py-1
            transition-colors
            ${
              isActive
                ? "text-cream"
                : "text-textMuted"
            }
          `;
        }

        return `
          flex items-center gap-3
          px-3 py-2.5
          rounded-xl
          text-sm
          transition-colors
          ${
            isActive
              ? "bg-surfaceRaised text-cream"
              : "text-textSecondary hover:bg-surface hover:text-textPrimary"
          }
        `;
      }}
    >
      <item.icon
        size={mobile ? 18 : 17}
        strokeWidth={1.8}
      />

      <span
        className={
          mobile
            ? "text-[9px] font-semibold"
            : mobileMore
            ? "text-xs font-medium"
            : "font-medium"
        }
      >
        {item.label}
      </span>
    </NavLink>
  );
}