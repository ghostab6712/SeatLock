
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeatMap from "./components/SeatMap";

const features = [
  {
    number: "01",
    title: "Real-time availability",
    description:
      "See which seats are available before you make a booking.",
  },
  {
    number: "02",
    title: "Reliable reservations",
    description:
      "Every booking is verified by the backend to prevent double-booking.",
  },
  {
    number: "03",
    title: "Your bookings, organized",
    description:
      "Keep track of your reservations and manage cancellations in one place.",
  },
];

type User = {
  id: number;
  email: string;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    function readSession() {
      try {
        const storedUser = sessionStorage.getItem("seatlock_user");
        const token = sessionStorage.getItem("seatlock_token");

        if (storedUser && token) {
          const parsedUser: User = JSON.parse(storedUser);

          if (
            typeof parsedUser.id === "number" &&
            typeof parsedUser.email === "string"
          ) {
            setUser(parsedUser);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setSessionChecked(true);
      }
    }

    readSession();

    window.addEventListener("storage", readSession);
    window.addEventListener("focus", readSession);

    return () => {
      window.removeEventListener("storage", readSession);
      window.removeEventListener("focus", readSession);
    };
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("seatlock_token");
    sessionStorage.removeItem("seatlock_user");
    setUser(null);
    router.push("/login");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#090d16] text-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">
            SeatLock<span className="text-cyan-400">.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sessionChecked && user ? (
            <>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="mt-1 text-sm font-semibold text-cyan-300">
                  {user.email}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  User ID: {user.id}
                </p>
              </div>

              <Link
                href="/bookings"
                className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                My Bookings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold transition hover:border-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </>
          ) : sessionChecked ? (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Register
              </Link>
            </>
          ) : (
            <span className="text-sm text-slate-400">Loading account...</span>
          )}
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-2 lg:px-10 lg:pb-32 lg:pt-24">
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-medium tracking-wide text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            SMARTER SEAT RESERVATIONS
          </div>

          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Your seat.
            <br />
            Your choice.
            <br />
            <span className="text-cyan-400">Locked in.</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-slate-400 sm:text-lg">
            Find your seat, reserve it with confidence, and manage every
            booking in one place. No confusion. No double-booking.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#how-it-works"
              className="rounded-xl bg-cyan-400 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Explore SeatLock <span aria-hidden="true">→</span>
            </a>

            <a
              href="#features"
              className="rounded-xl border border-white/15 px-6 py-4 font-semibold text-white transition hover:bg-white/5"
            >
              Discover features
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
            <span>
              <span className="mr-2 text-cyan-400">✓</span>
              Secure authentication
            </span>
            <span>
              <span className="mr-2 text-cyan-400">✓</span>
              Reliable booking system
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-10 rounded-full bg-cyan-400/10 blur-[90px]" />
          <div className="relative">
            <SeatMap />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-white/10 bg-white/[0.02] px-6 py-20 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">
            BUILT FOR CONFIDENCE
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Booking should be simple. And dependable.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-2xl border border-white/10 bg-[#101725] p-7 transition hover:-translate-y-1 hover:border-cyan-400/40"
              >
                <span className="text-sm font-semibold text-cyan-400">
                  {feature.number}
                </span>
                <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-10"
      >
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-transparent p-8 sm:p-12">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">
            THE NEXT STEP
          </p>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Find a seat. Make it yours.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Select your preferred seat and explore the interface. SeatLock
            connects your reservations to the booking backend.
          </p>
          {user && (
            <Link
              href="/bookings"
              className="mt-7 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Manage my bookings
            </Link>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-7 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>© 2026 SeatLock. Built for reliable reservations.</p>
          <p>Frontend · Next.js · TypeScript</p>
        </div>
      </footer>
    </main>
  );
}
