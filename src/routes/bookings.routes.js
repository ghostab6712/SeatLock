
const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

// POST /api/bookings
router.post("/", authenticateToken, async (req, res) => {
  const { seatId } = req.body;
  const userId = req.user.id;

  if (
    !Number.isInteger(seatId) ||
    seatId <= 0 ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "seatId must be a positive integer",
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    // Lock the seat to serialize concurrent booking attempts.
    const seatResult = await client.query(
      `SELECT id, seat_number
       FROM seats
       WHERE id = $1
       FOR UPDATE`,
      [seatId]
    );

    if (seatResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    const seat = seatResult.rows[0];

    // Availability depends on confirmed bookings.
    const bookingCheck = await client.query(
      `SELECT 1
       FROM bookings
       WHERE seat_id = $1
         AND status = 'confirmed'
       LIMIT 1`,
      [seatId]
    );

    if (bookingCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "Seat is already booked",
      });
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings (seat_id, user_id)
       VALUES ($1, $2)
       RETURNING
         id,
         seat_id AS "seatId",
         user_id AS "userId",
         status,
         created_at AS "createdAt"`,
      [seatId, userId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...bookingResult.rows[0],
        seatNumber: seat.seat_number,
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }
    }

    console.error("Error creating booking:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (client) client.release();
  }
});

// GET /api/bookings/:id — only the owner can view the booking.
router.get("/:id", authenticateToken, async (req, res) => {
  const bookingId = Number(req.params.id);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.seat_id AS "seatId",
         s.seat_number AS "seatNumber",
         b.user_id AS "userId",
         b.status,
         b.created_at AS "createdAt"
       FROM bookings b
       JOIN seats s ON s.id = b.seat_id
       WHERE b.id = $1
         AND b.user_id = $2`,
      [bookingId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching booking:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/bookings — list only the authenticated user's bookings.
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.seat_id AS "seatId",
         s.seat_number AS "seatNumber",
         b.user_id AS "userId",
         b.status,
         b.created_at AS "createdAt"
       FROM bookings b
       JOIN seats s ON s.id = b.seat_id
       WHERE b.user_id = $1
       ORDER BY b.id`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// PATCH /api/bookings/:id/cancel — only the owner can cancel.
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  const bookingId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
    });
  }

  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // Check ownership before proceeding to the seat lock.
    const initialResult = await client.query(
      `SELECT id, seat_id
       FROM bookings
       WHERE id = $1
         AND user_id = $2`,
      [bookingId, userId]
    );

    if (initialResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const seatId = initialResult.rows[0].seat_id;

    // Lock the seat first to maintain consistent lock ordering.
    const seatResult = await client.query(
      `SELECT id
       FROM seats
       WHERE id = $1
       FOR UPDATE`,
      [seatId]
    );

    if (seatResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "The booking's seat no longer exists",
      });
    }

    // Re-read and lock the booking after acquiring the seat lock.
    const bookingResult = await client.query(
      `SELECT id, seat_id, user_id, status
       FROM bookings
       WHERE id = $1
         AND user_id = $2
       FOR UPDATE`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "confirmed") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1
         AND user_id = $2`,
      [bookingId, userId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        id: booking.id,
        seatId: booking.seat_id,
        userId: booking.user_id,
        status: "cancelled",
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);
      }
    }

    console.error("Error cancelling booking:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
