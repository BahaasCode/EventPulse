// Copyright (c) 2026 Bahaa Elattar. All rights reserved.
// Submitted for evaluation purposes only. Do not reproduce or use without permission.

import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveFeed from "./pages/LiveFeed";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live"
          element={
            <ProtectedRoute>
              <LiveFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} />
      </Routes>
      <Toaster />
    </>
  );
}
