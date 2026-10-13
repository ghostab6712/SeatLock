
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const pool = require("../src/config/db");
const { getTestToken } = require("./auth.helper");

test("two simultaneous requests cannot book the same seat", async () => {
  let seatId;

  try {
    const token = await getTestToken();

    const seatResult = await pool.query(
      `SELECT id
       FROM seats
       WHERE seat_number = $1`,
      ["TEST-CONCURRENT"]
    );

    assert.equal(seatResult.rows.length, 1);
    seatId = seatResult.rows[0].id;

    // Clear previous bookings for this dedicated test seat.
    await pool.query(
      "DELETE FROM bookings WHERE seat_id = $1",
      [seatId]
    );

    // Both requests authenticate as the test user.
    const [responseA, responseB] = await Promise.all([
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ seatId }),

      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({ seatId }),
    ]);

    const statuses = [responseA.status, responseB.status].sort(
      (a, b) => a - b
    );

    assert.deepEqual(
      statuses,
      [201, 409],
      "Exactly one request should succeed and one should conflict"
    );

    const bookingResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM bookings
       WHERE seat_id = $1
         AND status = 'confirmed'`,
      [seatId]
    );

    assert.equal(bookingResult.rows[0].count, 1);

    const finalSeat = await pool.query(
      `SELECT NOT EXISTS (
         SELECT 1
         FROM bookings
         WHERE seat_id = $1
           AND status = 'confirmed'
       ) AS is_available`,
      [seatId]
    );

    assert.equal(finalSeat.rows[0].is_available, false);
  } finally {
    // Clean up only the dedicated concurrency-test seat.
    if (seatId !== undefined) {
      await pool.query(
        "DELETE FROM bookings WHERE seat_id = $1",
        [seatId]
      );
    }
  }
});
