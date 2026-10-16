
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Booking = {
  id: number;
  seatId: number;
  seatNumber: string;
  userId: number;
  status: string;
  createdAt: string;
};

export default function BookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchBookings = useCallback(async () => {
    const token = sessionStorage.getItem("seatlock_token");

    if (!token) {
      setError("Your login session is missing. Please log in again.");
      return;
    }

    const response = await fetch(`${API_URL}/api/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const result = await response.json();

    if (response.status === 401) {
      setError(
        "The server rejected your login token. Please log in again."
      );
      sessionStorage.removeItem("seatlock_token");
      sessionStorage.removeItem("seatlock_user");
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "Could not load your bookings.");
    }

    setBookings(result.data ?? []);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        await fetchBookings();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading bookings."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [fetchBookings]);

  async function handleCancel(booking: Booking) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your booking for seat ${booking.seatNumber}?`
    );

    if (!confirmed) return;

    try {
      setCancellingId(booking.id);
      setError("");
      setMessage("");

      const token = sessionStorage.getItem("seatlock_token");

      if (!token) {
        setError("Your login session is missing. Please log in again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/bookings/${booking.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        setError(
          "The server rejected your login token. Please log in again."
        );
        sessionStorage.removeItem("seatlock_token");
        sessionStorage.removeItem("seatlock_user");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Could not cancel this booking.");
      }

      setMessage(`Booking for seat ${booking.seatNumber} was cancelled.`);
      await fetchBookings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cancellation failed."
      );
    } finally {
      setCancellingId(null);
    }
  }

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold">
            Seat<span className="text-cyan-400">Lock</span>
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
          >
            Back to seats
          </Link>
        </header>

        <section className="mt-12">
          <p className="text-sm uppercase tracking-widest text-cyan-400">
            Your account
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            My Bookings
          </h1>
          <p className="mt-3 text-gray-400">
            View and manage your SeatLock reservations.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
          <p className="text-sm text-gray-400">Active reservations</p>
          <p className="mt-2 text-3xl font-bold">{confirmedCount}</p>
        </section>

        {message && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-300"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-16 text-center text-gray-400">
            Loading your bookings...
          </p>
        ) : bookings.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-dashed border-gray-700 p-10 text-center">
            <h2 className="text-xl font-semibold">No bookings yet</h2>
            <p className="mt-2 text-sm text-gray-400">
              Choose an available seat to make your first reservation.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-gray-950 transition hover:bg-cyan-300"
            >
              Find a seat
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {bookings.map((booking) => {
              const isConfirmed = booking.status === "confirmed";
              const isCancelling = cancellingId === booking.id;

              return (
                <article
                  key={booking.id}
                  className="flex flex-col gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        Seat {booking.seatNumber}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isConfirmed
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-400">
                      Booking ID: #{booking.id}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Booked on: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {isConfirmed && (
                    <button
                      type="button"
                      disabled={cancellingId !== null}
                      onClick={() => handleCancel(booking)}
                      className="rounded-lg border border-red-800 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel booking"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
