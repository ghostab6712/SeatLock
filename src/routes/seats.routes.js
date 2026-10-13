const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET /api/seats
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.seat_number,
         NOT EXISTS (
           SELECT 1
           FROM bookings b
           WHERE b.seat_id = s.id
             AND b.status = 'confirmed'
         ) AS is_available
       FROM seats s
       ORDER BY s.id`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching seats:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// GET /api/seats/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid seat ID",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.seat_number,
         NOT EXISTS (
           SELECT 1
           FROM bookings b
           WHERE b.seat_id = s.id
             AND b.status = 'confirmed'
         ) AS is_available
       FROM seats s
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Seat not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching seat:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;