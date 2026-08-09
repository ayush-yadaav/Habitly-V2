import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Welcome from "./pages/Welcome.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Streaks from "./pages/Streaks.jsx";
import History from "./pages/History.jsx";
import Analysis from "./pages/Analysis.jsx";
import ManageHabits from "./pages/ManageHabits.jsx";
import Journal from "./pages/Journal.jsx";
import Profile from "./pages/Profile.jsx";
import AIPlanner from "./pages/AIPlanner.jsx";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import PageLoader from "./components/PageLoader.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Restoring your session…" />;
  }
  if (!user) {
    return <Navigate to="/welcome" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="streaks" element={<Streaks />} />
        <Route path="history" element={<History />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="habits" element={<ManageHabits />} />
        <Route path="journal" element={<Journal />} />
        <Route path="profile" element={<Profile />} />
        <Route path="ai" element={<AIPlanner />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
