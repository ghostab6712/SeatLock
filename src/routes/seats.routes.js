
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Derive floor from numeric seat labels:
// 101–200 = Floor 1
// 201–300 = Floor 2
// 301–400 = Floor 3

// GET /api/seats
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.seat_number,
         CASE
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 101 AND 200
             THEN 1
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 201 AND 300
             THEN 2
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 301 AND 400
             THEN 3
           ELSE NULL
         END AS floor,
         NOT EXISTS (
           SELECT 1
           FROM bookings b
           WHERE b.seat_id = s.id
             AND b.status = 'confirmed'
         ) AS is_available
       FROM seats s
       ORDER BY
         CASE
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 101 AND 200
             THEN 1
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 201 AND 300
             THEN 2
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 301 AND 400
             THEN 3
           ELSE 4
         END,
         CASE
           WHEN s.seat_number ~ '^[0-9]{3}$'
             THEN CAST(s.seat_number AS INTEGER)
           ELSE NULL
         END,
         s.seat_number`
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
         CASE
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 101 AND 200
             THEN 1
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 201 AND 300
             THEN 2
           WHEN s.seat_number ~ '^[0-9]{3}$'
             AND CAST(s.seat_number AS INTEGER) BETWEEN 301 AND 400
             THEN 3
           ELSE NULL
         END AS floor,
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
