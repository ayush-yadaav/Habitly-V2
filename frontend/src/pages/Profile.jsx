import React, { useEffect, useState } from "react";
import { ExternalLink, Eye, EyeOff, KeyRound, LogOut, Moon, ShieldCheck, Sun, Trash2, Unplug } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../lib/api.js";
import ButtonSpinner from "../components/ButtonSpinner.jsx";

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [personalKey, setPersonalKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState({ configured: false });
  const [savingKey, setSavingKey] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await api.put("/auth/profile", { name });
      setMsg("Profile updated.");
      setTimeout(() => setMsg(""), 2000);
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.put("/auth/password", { currentPassword: passwords.current, newPassword: passwords.next });
      setMsg("Password changed.");
      setPasswords({ current: "", next: "" });
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not change password.");
    }
    setTimeout(() => setMsg(""), 2500);
    setChangingPassword(false);
  };

  const loadKeyStatus = async () => {
    try {
      const res = await api.get("/ai/personal-key");
      setKeyStatus(res.data || { configured: false });
    } catch (err) {
      setKeyError(err.response?.data?.error || "Could not load Gemini key status.");
    }
  };

  useEffect(() => {
    loadKeyStatus();
  }, []);

  const savePersonalKey = async (e) => {
    e.preventDefault();
    if (!personalKey.trim()) return;
    setSavingKey(true);
    setKeyError("");
    try {
      const res = await api.put("/ai/personal-key", { apiKey: personalKey.trim() });
      setKeyStatus(res.data.status);
      setPersonalKey("");
      setShowKey(false);
      setMsg("Your Gemini key is connected.");
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      setKeyError(err.response?.data?.error || "Could not save your Gemini key.");
    } finally {
      setSavingKey(false);
    }
  };

  const removePersonalKey = async () => {
    setRemovingKey(true);
    setKeyError("");
    try {
      await api.delete("/ai/personal-key");
      setKeyStatus({ configured: false });
      setMsg("Your personal Gemini key was removed.");
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      setKeyError(err.response?.data?.error || "Could not remove your Gemini key.");
    } finally {
      setRemovingKey(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/auth/account");
      logout();
      window.location.href = "/welcome";
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <header className="mb-7">
        <p className="eyebrow">Personal</p>
        <h1 className="font-display text-4xl font-semibold mt-1">Profile</h1>
        <p className="text-sm text-textMuted mt-2">Your account, appearance and optional AI connection.</p>
      </header>

      <div className="w-16 h-16 rounded-full bg-surfaceRaised border border-border flex items-center justify-center font-display text-xl font-bold mb-6">
        {user?.name?.[0]?.toUpperCase() || "?"}
      </div>

      <form onSubmit={saveName} className="content-panel mb-4">
        <p className="eyebrow">Identity</p>
        <p className="text-xs text-textMuted mt-2 mb-3">{user?.email}</p>
        <label className="text-xs font-semibold">
          Display name
          <div className="flex gap-2 mt-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} className="field-control mt-0 flex-1" />
            <button disabled={savingName} className="primary-button px-4">
              {savingName ? <ButtonSpinner /> : "Save"}
            </button>
          </div>
        </label>
      </form>

      <section className="content-panel mb-4">
        <p className="eyebrow">Appearance</p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button type="button" onClick={() => setTheme("light")} className={`rounded-xl border px-3 py-3 text-left ${theme === "light" ? "border-cream bg-cream/10" : "border-border"}`}>
            <Sun size={15} className="mb-2" />
            <p className="text-xs font-semibold">Light</p>
            <p className="text-[9px] text-textMuted">Soft mint paper</p>
          </button>
          <button type="button" onClick={() => setTheme("dark")} className={`rounded-xl border px-3 py-3 text-left ${theme === "dark" ? "border-cream bg-cream/10" : "border-border"}`}>
            <Moon size={15} className="mb-2" />
            <p className="text-xs font-semibold">Dark</p>
            <p className="text-[9px] text-textMuted">Charcoal + orange</p>
          </button>
        </div>
      </section>

      <section className="content-panel mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Optional AI connection</p>
            <div className="flex items-center gap-2 mt-1">
              <KeyRound size={18} className="text-cream" />
              <h2 className="font-display text-2xl font-semibold">Use your Gemini quota</h2>
            </div>
            <p className="text-xs text-textMuted mt-2 leading-relaxed max-w-xl">
              Habitly uses its default AI quota first. After your 3 daily Habitly generations are used, a connected personal Gemini key can continue your AI planning without exposing the key to the browser.
            </p>
          </div>
          {keyStatus.configured && (
            <span className="source-pill shrink-0">Connected · ••••{keyStatus.last4}</span>
          )}
        </div>

        <div className="mt-5 border border-border rounded-2xl p-4 bg-bg">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">Stored securely</p>
              <p className="text-[10px] text-textMuted mt-1 leading-relaxed">The key is encrypted on the server and is never returned to this page after saving. It is not stored in localStorage.</p>
            </div>
          </div>
        </div>

        <form onSubmit={savePersonalKey} className="mt-4">
          <label className="text-xs font-semibold">
            {keyStatus.configured ? "Replace personal Gemini key" : "Gemini API key"}
            <div className="relative mt-1.5">
              <input
                type={showKey ? "text" : "password"}
                value={personalKey}
                onChange={(e) => setPersonalKey(e.target.value)}
                placeholder="Paste your Gemini API key"
                autoComplete="off"
                className="field-control mt-0 pr-11"
              />
              <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 icon-button" aria-label={showKey ? "Hide key" : "Show key"}>
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
          <div className="flex flex-wrap gap-2 mt-3">
            <button disabled={savingKey || !personalKey.trim()} className="primary-button">
              {savingKey ? <ButtonSpinner label="Securing…" /> : "Save personal key"}
            </button>
            {keyStatus.configured && (
              <button type="button" disabled={removingKey} onClick={removePersonalKey} className="secondary-button text-pink">
                {removingKey ? <ButtonSpinner label="Removing…" /> : <><Unplug size={13} /> Remove key</>}
              </button>
            )}
          </div>
        </form>

        {keyError && <p className="text-xs text-pink mt-3">{keyError}</p>}

        <div className="mt-5 border-t border-border pt-4">
          <p className="eyebrow">How to get a key</p>
          <ol className="mt-3 space-y-2 text-xs text-textSecondary list-decimal pl-5">
            <li>Open Google AI Studio and sign in with your Google account.</li>
            <li>Open the API Keys page and choose <strong className="text-textPrimary">Create API key</strong>.</li>
            <li>Choose or create a Google Cloud project when asked.</li>
            <li>Copy the new key and paste it into Habitly above.</li>
          </ol>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream mt-4">
            Open Google AI Studio <ExternalLink size={12} />
          </a>
          <p className="text-[10px] text-textMuted mt-3 leading-relaxed">
            Important: Gemini rate limits are applied per Google project, not per API key. If you create another key in the same project, it does not create extra quota. For more usage, use a separate project or the appropriate paid tier.
          </p>
        </div>
      </section>

      <form onSubmit={changePassword} className="content-panel mb-4">
        <p className="eyebrow">Security</p>
        <p className="text-sm font-semibold mt-1">Change password</p>
        <div className="flex flex-col gap-2 mt-3">
          <input type="password" placeholder="Current password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="field-control mt-0" />
          <input type="password" placeholder="New password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className="field-control mt-0" />
          <button disabled={changingPassword} className="secondary-button w-full mt-1">
            {changingPassword ? <ButtonSpinner label="Updating…" /> : "Update password"}
          </button>
        </div>
      </form>

      {msg && <p className="text-xs text-cream mb-4">{msg}</p>}

      <button onClick={() => { logout(); window.location.href = "/welcome"; }} className="w-full flex items-center gap-3 content-panel text-sm font-medium mb-3">
        <LogOut size={16} className="text-textSecondary" /> Log out
      </button>

      {!confirmingDelete ? (
        <button onClick={() => setConfirmingDelete(true)} className="w-full flex items-center gap-3 text-pink px-4 py-3.5 text-sm font-medium">
          <Trash2 size={16} /> Delete account
        </button>
      ) : (
        <div className="bg-surface border border-pink rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold mb-1">Delete your account?</p>
          <p className="text-xs text-textMuted mb-3">All habits, streaks, plans and journal entries will be permanently removed.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} className="flex-1 border border-border rounded-xl py-2 text-sm">Cancel</button>
            <button type="button" onClick={deleteAccount} disabled={deleting} className="flex-1 bg-pink text-[#3A2530] font-semibold rounded-xl py-2 text-sm disabled:opacity-60">
              {deleting ? <ButtonSpinner label="Deleting…" /> : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
