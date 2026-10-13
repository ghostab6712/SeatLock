
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const pool = require("../src/config/db");
const { getTestToken } = require("./auth.helper");

test("users cannot access or cancel another user's booking", async () => {
  const userAToken = await getTestToken();

  const userBEmail = "seatlock.authz.userb@example.com";
  const userBPassword = "SeatLockOther123!";

  let seatId;
  let bookingId;

  try {
    // Register User B, or reuse the account if it already exists.
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        email: userBEmail,
        password: userBPassword,
      });

    assert.ok(
      [201, 409].includes(registration.status),
      `User B registration failed: ${registration.status}`
    );

    // Log in as User B to obtain a separate token.
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: userBEmail,
        password: userBPassword,
      });

    assert.equal(login.status, 200);

    const userBToken = login.body.data.token;
    const userBId = login.body.data.user.id;

    // Create a dedicated seat for this authorization test.
    const seatResult = await pool.query(
      `INSERT INTO seats (seat_number)
       VALUES ($1)
       RETURNING id`,
      ["TEST-AUTHZ"]
    );

    seatId = seatResult.rows[0].id;

    // Create a booking owned by User B.
    const bookingResult = await pool.query(
      `INSERT INTO bookings (seat_id, user_id)
       VALUES ($1, $2)
       RETURNING id`,
      [seatId, userBId]
    );

    bookingId = bookingResult.rows[0].id;

    // User A cannot retrieve User B's booking.
    const getBooking = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${userAToken}`);

    assert.equal(getBooking.status, 404);

    // User A cannot cancel User B's booking.
    const cancelBooking = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${userAToken}`);

    assert.equal(cancelBooking.status, 404);

    // User A's booking list must not include User B's booking.
    const listBookings = await request(app)
      .get("/api/bookings")
      .set("Authorization", `Bearer ${userAToken}`);

    assert.equal(listBookings.status, 200);

    assert.equal(
      listBookings.body.data.some(
        (booking) => booking.id === bookingId
      ),
      false
    );

    // Confirm User B's booking is still active.
    const storedBooking = await pool.query(
      `SELECT status
       FROM bookings
       WHERE id = $1`,
      [bookingId]
    );

    assert.equal(storedBooking.rows[0].status, "confirmed");

    // User B can still retrieve their own booking.
    const ownerRequest = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${userBToken}`);

    assert.equal(ownerRequest.status, 200);
    assert.equal(ownerRequest.body.data.userId, userBId);
  } finally {
    // Clean up the dedicated test data.
    if (seatId !== undefined) {
      await pool.query(
        "DELETE FROM bookings WHERE seat_id = $1",
        [seatId]
      );

      await pool.query(
        "DELETE FROM seats WHERE id = $1",
        [seatId]
      );
    }
  }
});

test("booking endpoints reject requests without a token", async () => {
  const responses = await Promise.all([
    request(app).get("/api/bookings"),
    request(app).get("/api/bookings/1"),
    request(app).post("/api/bookings").send({ seatId: 1 }),
    request(app).patch("/api/bookings/1/cancel"),
  ]);

  for (const response of responses) {
    assert.equal(response.status, 401);
  }
});
