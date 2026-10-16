
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
    };
    token: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(result.message || "Login failed. Please try again.");
        return;
      }

      // Temporary development integration.
      // Production authentication should use an HttpOnly cookie.
      sessionStorage.setItem("seatlock_token", result.data.token);
      sessionStorage.setItem(
        "seatlock_user",
        JSON.stringify(result.data.user)
      );

      router.push("/");
    } catch {
      setError(
        "Unable to connect to SeatLock. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090d16] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
            S
          </div>
          <span className="text-2xl font-bold">
            SeatLock<span className="text-cyan-400">.</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#101725] p-7 shadow-2xl sm:p-9">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">
            WELCOME BACK
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Sign in to SeatLock
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Sign in to manage your reservations and choose your next seat.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#0b111d] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/10 bg-[#0b111d] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          SeatLock · Reliable seat reservations
        </p>
      </div>
    </main>
  );
}
