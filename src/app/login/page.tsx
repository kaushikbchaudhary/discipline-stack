"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = "/today";
      }
    });
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message || "Invalid credentials.");
      return;
    }
    toast.success("Welcome back.");
    window.location.href = "/today";
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        toast.error(error.message || "Could not create account.");
        return;
      }
      toast.success("Account created. Check your email if confirmation is required.");
      window.location.href = "/today";
    });
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 py-16">
      <div className="card w-full max-w-4xl overflow-hidden">
        <div className="grid gap-10 p-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-muted">Execution OS</p>
              <h1 className="text-4xl font-semibold">Focus on the next required move.</h1>
              <p className="text-base text-muted">
                Build a daily timetable, follow a 30-day plan, and only complete a day when
                daily tasks are completed.
              </p>
            </div>
            <div className="card-muted rounded-2xl border border-[color:var(--border)] p-5 text-sm text-muted">
              Minimal UI. Clear outcomes. No motivational noise.
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex gap-2 rounded-full bg-[color:var(--bg-alt)] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-white text-black shadow"
                    : "text-muted hover:text-black"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-white text-black shadow"
                    : "text-muted hover:text-black"
                }`}
              >
                Create account
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--accent-strong)]"
                >
                  Enter today view
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    required
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  Build my plan
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
