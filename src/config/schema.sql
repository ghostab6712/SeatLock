-- SeatLock database schema
-- Run against a fresh database.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_legacy BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT users_check
        CHECK (
            is_legacy = TRUE
            OR (email IS NOT NULL AND password_hash IS NOT NULL)
        )
);

CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    seat_number VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bookings_status_check
        CHECK (status IN ('confirmed', 'cancelled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking_per_seat
    ON bookings (seat_id)
    WHERE status = 'confirmed';