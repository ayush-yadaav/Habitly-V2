import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("habitly_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("habitly_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.user);
          localStorage.setItem("habitly_user", JSON.stringify(res.data.user));
        } catch {
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    verify();
  }, []);

  function persist(token, user) {
    localStorage.setItem("habitly_token", token);
    localStorage.setItem("habitly_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password });
    persist(res.data.token, res.data.user);
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    persist(res.data.token, res.data.user);
  }

  function logout() {
    localStorage.removeItem("habitly_token");
    localStorage.removeItem("habitly_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
