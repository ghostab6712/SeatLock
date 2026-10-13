
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

test("GET / returns the SeatLock health message", async () => {
  const response = await request(app).get("/");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    message: "SeatLock backend is running",
  });
});

test("GET /api/seats returns seats from PostgreSQL", async () => {
  const response = await request(app).get("/api/seats");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 1);

  assert.ok(
    response.body.some((seat) => seat.seat_number === "A1")
  );
});
