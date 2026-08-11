// Copyright (c) 2026 Bahaa Elattar. All rights reserved.
// Submitted for evaluation purposes only. Do not reproduce or use without permission.

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserRole = "admin" | "analyst" | "viewer";

interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem("auth_token", token);
        set({ token, user, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem("auth_token");
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
