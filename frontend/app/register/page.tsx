"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(
          result.message || result.error || "Registration failed."
        );
        return;
      }

      setMessage("Registration successful! You can now log in.");
      setEmail("");
      setPassword("");
    } catch {
      setIsError(true);
      setMessage("Cannot connect to the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <Link href="/" className="text-2xl font-bold">
          Seat<span className="text-blue-500">Lock</span>
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Create your account</h1>
        <p className="mb-8 mt-2 text-sm text-gray-400">
          Register to start using SeatLock.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm">
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
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            className={`mt-5 text-sm ${isError ? "text-red-400" : "text-green-400"}`}
          >
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
