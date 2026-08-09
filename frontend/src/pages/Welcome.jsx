import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Flame, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const slides = [
  { title: "Build a day you can repeat", text: "Keep your main routine clear, your supporting habits light, and your progress easy to see." },
  { title: "Turn goals into daily work", text: "Create a roadmap with AI or bring your own roadmap and let Habitly break it into practical days." },
  { title: "Keep every plan", text: "Your generated plans stay in your workspace. Start another without losing the one you already built." },
];

export default function Welcome() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState("intro");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const goApp = () => navigate(location.state?.from || "/", { replace: true });
  const handleAuth = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "register") await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      goApp();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="landing-shell px-5 py-6 md:px-10 md:py-8 flex items-center justify-center">
      <motion.div className="landing-orb w-64 h-64 md:w-96 md:h-96 bg-teal/10 -left-24 -top-24" animate={{ x: [0, 18, 0], y: [0, 12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="landing-orb w-52 h-52 md:w-80 md:h-80 bg-yellow/10 right-0 bottom-0" animate={{ x: [0, -14, 0], y: [0, -10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_.75fr] gap-5 items-stretch relative z-10">
        <section className="landing-card p-7 md:p-10 hidden lg:flex flex-col justify-between min-h-[620px]">
          <div>
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-cream text-bg grid place-items-center"><Flame size={19} /></span><span className="font-display text-2xl font-semibold">Habitly</span></div>
            <div className="mt-20 max-w-xl"><p className="eyebrow">A calmer way to build consistency</p><h1 className="font-display text-6xl leading-[.95] font-semibold mt-3">Make progress<br /><span className="text-cream">visible.</span></h1><p className="text-sm text-textSecondary max-w-md leading-relaxed mt-6">A focused habit system for everyday routines and long-term goals — with an AI planner that turns roadmaps into work you can actually do.</p></div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">{["Main goals stay clear", "AI plans stay saved", "Streaks stay separate"].map((text) => <div key={text} className="border border-border rounded-2xl p-3 bg-bg/35"><Check size={14} className="text-teal mb-5" /><p className="text-[10px] font-semibold leading-relaxed">{text}</p></div>)}</div>
        </section>

        <section className="landing-card p-6 md:p-8 min-h-[580px] flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2 mb-9"><span className="w-9 h-9 rounded-xl bg-cream text-bg grid place-items-center"><Flame size={17} /></span><span className="font-display text-xl font-semibold">Habitly</span></div>
          <AnimatePresence mode="wait">
            {step === "intro" ? (
              <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .3 }}>
                <div className="flex items-center gap-2 text-textMuted"><Sparkles size={15} /><span className="eyebrow">Daily systems, made personal</span></div>
                <AnimatePresence mode="wait"><motion.div key={slideIdx} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .28 }} className="mt-7"><h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">{slides[slideIdx].title}</h2><p className="text-sm text-textSecondary leading-relaxed mt-4 max-w-md">{slides[slideIdx].text}</p></motion.div></AnimatePresence>
                <div className="flex gap-1.5 mt-8">{slides.map((_, i) => <button aria-label={`Slide ${i + 1}`} key={i} onClick={() => setSlideIdx(i)} className={`h-1.5 rounded-full transition-all ${i === slideIdx ? "w-8 bg-cream" : "w-1.5 bg-border"}`} />)}</div>
                <button onClick={() => (slideIdx < slides.length - 1 ? setSlideIdx(slideIdx + 1) : setStep("auth"))} className="primary-button w-full mt-9">{slideIdx < slides.length - 1 ? "Continue" : "Get started"}<ArrowRight size={15} /></button>
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .3 }}>
                <button onClick={() => setStep("intro")} className="text-[10px] text-textMuted hover:text-textPrimary mb-7">← Back</button>
                <h2 className="font-display text-4xl font-semibold">{mode === "login" ? "Welcome back." : "Start your system."}</h2>
                <p className="text-sm text-textMuted mt-2 mb-7">{mode === "login" ? "Your routines are waiting." : "Create your workspace in under a minute."}</p>
                <form onSubmit={handleAuth} className="flex flex-col gap-3">
                  {mode === "register" && <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field-control" />}
                  <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field-control" />
                  <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field-control" />
                  {error && <p className="text-pink text-xs">{error}</p>}
                  <button disabled={loading} className="primary-button w-full mt-2">{loading && <Loader2 size={15} className="animate-spin" />}{mode === "login" ? "Log in" : "Create account"}</button>
                </form>
                <p className="text-center text-xs text-textMuted mt-6">{mode === "login" ? "New here?" : "Already have an account?"}{" "}<button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-cream font-semibold">{mode === "login" ? "Create an account" : "Log in"}</button></p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
