// Copyright (c) 2026 Bahaa Elattar. All rights reserved.
// Submitted for evaluation purposes only. Do not reproduce or use without permission.

import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import type { ReactNode } from "react";

/**
 * Simple guard that reads local auth state only.
 * No network call needed — the mock token lives in localStorage via Zustand persist.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
