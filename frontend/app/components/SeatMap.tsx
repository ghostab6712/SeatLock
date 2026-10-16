
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Seat = {
  id: number;
  seat_number: string;
  floor: number | null;
  is_available: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const FLOORS = [1, 2, 3] as const;

export default function SeatMap() {
  const router = useRouter();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const fetchSeats = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/seats`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch seats (${response.status})`);
    }

    const data: Seat[] = await response.json();
    setSeats(data);

    setSelectedSeatId((currentId) => {
      if (currentId === null) return null;

      const currentSeat = data.find((seat) => seat.id === currentId);
      return currentSeat?.is_available ? currentId : null;
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSeats() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/seats`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch seats (${response.status})`);
        }

        const data: Seat[] = await response.json();

        if (active) {
          setSeats(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load seats."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSeats();

    return () => {
      active = false;
    };
  }, []);

  // Display only seats belonging to the selected floor.
  const floorSeats = seats.filter(
    (seat) => seat.floor === selectedFloor
  );

  const availableCount = floorSeats.filter(
    (seat) => seat.is_available
  ).length;

  const bookedCount = floorSeats.filter(
    (seat) => !seat.is_available
  ).length;

  const selectedSeat = seats.find(
    (seat) => seat.id === selectedSeatId
  );

  function handleFloorChange(floor: number) {
    setSelectedFloor(floor);
    setSelectedSeatId(null);
    setMessage("");
    setIsError(false);
  }

  function handleSeatClick(seat: Seat) {
    if (!seat.is_available || booking) return;

    setMessage("");
    setIsError(false);

    setSelectedSeatId((currentId) =>
      currentId === seat.id ? null : seat.id
    );
  }

  async function handleBooking() {
    if (!selectedSeat) {
      setMessage("Please select an available seat first.");
      setIsError(true);
      return;
    }

    const token = sessionStorage.getItem("seatlock_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setBooking(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seatId: selectedSeat.id,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("seatlock_token");
        sessionStorage.removeItem("seatlock_user");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setIsError(true);
        setMessage(
          result.message ||
            result.error ||
            "Booking failed. Please try again."
        );

        if (response.status === 409) {
          await fetchSeats();
        }

        return;
      }

      setMessage(
        `Successfully booked seat ${
          result.data?.seatNumber || selectedSeat.seat_number
        }!`
      );

      setSelectedSeatId(null);

      await fetchSeats();
    } catch (err) {
      setIsError(true);
      setMessage(
        err instanceof Error
          ? `Booking request failed: ${err.message}`
          : "Unable to complete your booking. Please try again."
      );
    } finally {
      setBooking(false);
    }
  }

  async function handleRetry() {
    try {
      setLoading(true);
      setError(null);
      await fetchSeats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load seats."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#101725] p-5 text-white shadow-2xl shadow-black/30 sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            LIBRARY SEAT RESERVATION
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Choose your seat
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            3 floors · 100 seats per floor
          </p>
        </div>

        <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">
          LIVE DATA
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          Loading seats from SeatLock...
        </div>
      ) : error ? (
        /* Error state */
        <div
          role="alert"
          className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 p-5"
        >
          <p className="font-semibold text-red-300">
            Could not load seats
          </p>
          <p className="mt-2 break-words text-sm text-slate-300">
            {error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            Retry
          </button>
        </div>
      ) : seats.length === 0 ? (
        <p className="py-12 text-center text-slate-400">
          No seats are available to display.
        </p>
      ) : (
        <>
          {/* Floor selector */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {FLOORS.map((floor) => {
              const seatsOnFloor = seats.filter(
                (seat) => seat.floor === floor
              );

              const availableOnFloor = seatsOnFloor.filter(
                (seat) => seat.is_available
              ).length;

              const isActive = selectedFloor === floor;

              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => handleFloorChange(floor)}
                  aria-pressed={isActive}
                  className={`rounded-xl border p-3 text-left transition sm:p-4 ${
                    isActive
                      ? "border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/30"
                      : "border-white/10 bg-white/[0.03] hover:border-white/30"
                  }`}
                >
                  <span className="block font-semibold">
                    Floor {floor}
                  </span>
                  <span
                    className={`mt-2 block text-xs ${
                      isActive ? "text-cyan-300" : "text-slate-400"
                    }`}
                  >
                    {seatsOnFloor.length} seats
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {availableOnFloor} available
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected floor summary */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">
                Floor {selectedFloor}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Select an available seat from the map below.
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
              {availableCount} available · {bookedCount} booked
            </span>
          </div>

          {/* Seat map */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#0b111d] p-4 sm:p-6">
            <div className="mx-auto mb-6 w-2/3 rounded-t-[50%] border-t-2 border-cyan-400/70 pt-3 text-center text-xs tracking-[0.3em] text-slate-500">
              FRONT
            </div>

            {floorSeats.length === 0 ? (
              <p className="py-12 text-center text-slate-400">
                No seats found for this floor.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 sm:gap-3">
                {floorSeats.map((seat) => {
                  const isSelected = selectedSeatId === seat.id;
                  const isBooked = !seat.is_available;

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isBooked || booking}
                      onClick={() => handleSeatClick(seat)}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${seat.seat_number}, ${
                        isBooked
                          ? "booked"
                          : isSelected
                            ? "selected"
                            : "available"
                      }`}
                      title={`${seat.seat_number} — ${
                        isBooked ? "Booked" : "Available"
                      }`}
                      className={`flex aspect-square min-w-0 items-center justify-center rounded-lg border px-0.5 text-[9px] font-semibold transition sm:rounded-xl sm:px-1 sm:text-[11px] ${
                        isBooked
                          ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500"
                          : isSelected
                            ? "border-cyan-300 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-300 hover:bg-emerald-400/20"
                      }`}
                    >
                      {seat.seat_number.replace("-S", "-")}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-emerald-400" />
                Available
              </span>

              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-cyan-400" />
                Selected
              </span>

              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-slate-600" />
                Booked
              </span>
            </div>
          </div>

          {/* Booking panel */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">
              SEAT SELECTION
            </p>

            {selectedSeat ? (
              <div className="mt-2">
                <p className="font-semibold">
                  Selected seat:{" "}
                  <span className="text-cyan-400">
                    {selectedSeat.seat_number}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Floor {selectedSeat.floor}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-slate-400">
                Pick an available seat to continue.
              </p>
            )}

            {message && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-4 break-words text-sm ${
                  isError ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="button"
              disabled={selectedSeatId === null || booking}
              onClick={handleBooking}
              className="mt-4 w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {booking
                ? "Booking seat..."
                : selectedSeat
                  ? `Book ${selectedSeat.seat_number}`
                  : "Continue"}
            </button>
          </div>
        </>
      )}

      <p className="mt-4 text-center text-xs text-slate-500">
        Availability is loaded from your SeatLock backend.
      </p>
    </section>
  );
}
