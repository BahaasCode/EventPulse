// Copyright (c) 2026 Bahaa Elattar. All rights reserved.
// Submitted for evaluation purposes only. Do not reproduce or use without permission.

import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Local mock auth — no backend required.
// Users are stored as JSON in localStorage under the key "mock_users".
// ---------------------------------------------------------------------------

interface MockUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "analyst" | "viewer";
  passwordHash: string; // stored as plain text for local-only mock
}

function getMockUsers(): MockUser[] {
  try {
    return JSON.parse(localStorage.getItem("mock_users") ?? "[]");
  } catch {
    return [];
  }
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem("mock_users", JSON.stringify(users));
}

function makeMockToken(user: Omit<MockUser, "passwordHash">): string {
  // Not a real JWT — just a base64 payload so the rest of the app can read it
  const payload = btoa(JSON.stringify({ sub: user.id, ...user, exp: Date.now() + 7 * 86400_000 }));
  return `mock.${payload}.sig`;
}

// ---------------------------------------------------------------------------

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a small async delay so loading state is visible
    await new Promise((r) => setTimeout(r, 400));

    const users = getMockUsers();
    const found = users.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());

    if (!found || found.passwordHash !== loginPassword) {
      toast.error("Invalid email or password.");
      setIsLoading(false);
      return;
    }

    const { passwordHash: _, ...userWithoutPw } = found;
    const token = makeMockToken(userWithoutPw);
    setAuth(token, userWithoutPw);
    toast.success(`Welcome back, ${found.name}!`);
    navigate("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const users = getMockUsers();
    if (users.some((u) => u.email.toLowerCase() === regEmail.toLowerCase())) {
      toast.error("An account with that email already exists.");
      setIsLoading(false);
      return;
    }

    const newUser: MockUser = {
      id: Date.now(),
      email: regEmail,
      name: regName,
      role: "admin", // first user gets admin so they can see everything
      passwordHash: regPassword,
    };
    saveMockUsers([...users, newUser]);

    const { passwordHash: _, ...userWithoutPw } = newUser;
    const token = makeMockToken(userWithoutPw);
    setAuth(token, userWithoutPw);
    toast.success(`Account created! Welcome, ${regName}!`);
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap className="h-8 w-8 text-emerald-400" />
          <span className="font-bold text-2xl tracking-tight text-slate-100">EventPulse</span>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg font-semibold text-slate-200">
              Event Planner
            </CardTitle>
            <p className="text-center text-sm text-slate-500">
              Sign in or create an account to continue
            </p>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-800 mb-4">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-slate-700 text-slate-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-slate-700 text-slate-300"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              {/* ── Sign In ────────────────────────────────────── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-slate-400">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-400">
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Sign In
                  </Button>
                  <p className="text-center text-xs text-slate-600 pt-1">
                    No account yet?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
                    >
                      Create one
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* ── Create Account ─────────────────────────────── */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-slate-400">
                      Full Name
                    </Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      autoComplete="name"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-slate-400">
                      Email
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-slate-400">
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm" className="text-slate-400">
                      Confirm Password
                    </Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Repeat your password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Account
                  </Button>
                  <p className="text-center text-xs text-slate-600 pt-1">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          EventPulse — Local Deployment
        </p>
      </div>
    </div>
  );
}
