-- Ensure bookings can only have supported statuses.
-- Safe to run if the constraint already exists.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'bookings_status_check'
          AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('confirmed', 'cancelled'));
    END IF;
END $$;