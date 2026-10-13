
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const pool = require("../src/config/db");
const app = require("../src/app");
const { getTestToken } = require("./auth.helper");

test("booking lifecycle: book, reject duplicate, cancel, rebook", async () => {
  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const seatResult = await client.query(
      "SELECT id FROM seats WHERE seat_number = $1 FOR UPDATE",
      ["TEST-1"]
    );

    assert.equal(seatResult.rows.length, 1);

    const seatId = seatResult.rows[0].id;

    await client.query(
      "DELETE FROM bookings WHERE seat_id = $1",
      [seatId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    const token = await getTestToken();

    // 1. Book the seat.
    const firstBooking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ seatId });

    assert.equal(firstBooking.status, 201);
    assert.equal(firstBooking.body.data.status, "confirmed");
    assert.equal(firstBooking.body.data.userId, 900302);

    const firstBookingId = firstBooking.body.data.id;

    // 2. A duplicate booking must be rejected.
    const duplicateBooking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ seatId });

    assert.equal(duplicateBooking.status, 409);

    // 3. Cancel the original booking.
    const cancellation = await request(app)
      .patch(`/api/bookings/${firstBookingId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(cancellation.status, 200);
    assert.equal(cancellation.body.data.status, "cancelled");

    // 4. Repeated cancellation must be rejected.
    const repeatedCancellation = await request(app)
      .patch(`/api/bookings/${firstBookingId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(repeatedCancellation.status, 409);

    // 5. Rebook the released seat.
    const secondBooking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ seatId });

    assert.equal(secondBooking.status, 201);
    assert.notEqual(secondBooking.body.data.id, firstBookingId);

    // Verify booking history.
    const history = await pool.query(
      `SELECT status
       FROM bookings
       WHERE seat_id = $1
       ORDER BY id`,
      [seatId]
    );

    assert.deepEqual(
      history.rows.map((booking) => booking.status),
      ["cancelled", "confirmed"]
    );

    // Verify availability from confirmed bookings.
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
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }

    if (client) {
      client.release();
    }

    // Clean up only TEST-1 and its bookings.
    const testSeat = await pool.query(
      "SELECT id FROM seats WHERE seat_number = $1",
      ["TEST-1"]
    );

    if (testSeat.rows.length > 0) {
      await pool.query(
        "DELETE FROM bookings WHERE seat_id = $1",
        [testSeat.rows[0].id]
      );
    }
  }
});

test("GET /api/bookings/:id returns an existing booking", async () => {
  const token = await getTestToken();

  const seatResult = await pool.query(
    "SELECT id FROM seats WHERE seat_number = $1",
    ["TEST-1"]
  );

  assert.equal(seatResult.rows.length, 1);

  const seatId = seatResult.rows[0].id;

  const bookingResult = await pool.query(
    `INSERT INTO bookings (seat_id, user_id)
     VALUES ($1, $2)
     RETURNING id`,
    [seatId, 900302]
  );

  const bookingId = bookingResult.rows[0].id;

  try {
    const response = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.id, bookingId);
    assert.equal(response.body.data.seatId, seatId);
    assert.equal(response.body.data.userId, 900302);
    assert.equal(response.body.data.status, "confirmed");
  } finally {
    await pool.query(
      "DELETE FROM bookings WHERE id = $1",
      [bookingId]
    );
  }
});

test("GET /api/bookings/:id returns 404 for a nonexistent booking", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .get("/api/bookings/999999")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Booking not found");
});

test("GET /api/bookings/:id rejects an invalid ID", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .get("/api/bookings/abc")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Invalid booking ID");
});

test("GET /api/bookings/:id returns cancelled booking history", async () => {
  const token = await getTestToken();

  const seatResult = await pool.query(
    "SELECT id FROM seats WHERE seat_number = $1",
    ["TEST-LOOKUP"]
  );

  assert.equal(seatResult.rows.length, 1);

  const seatId = seatResult.rows[0].id;
  let bookingId;

  try {
    const bookingResult = await pool.query(
      `INSERT INTO bookings (seat_id, user_id)
       VALUES ($1, $2)
       RETURNING id`,
      [seatId, 900302]
    );

    bookingId = bookingResult.rows[0].id;

    const cancellation = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(cancellation.status, 200);

    const response = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.id, bookingId);
    assert.equal(response.body.data.status, "cancelled");
  } finally {
    if (bookingId !== undefined) {
      await pool.query(
        "DELETE FROM bookings WHERE id = $1",
        [bookingId]
      );
    }
  }
});
