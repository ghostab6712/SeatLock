
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

test("GET /api/seats returns numbered seats with floor information", async () => {
  const response = await request(app).get("/api/seats");

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 1);

  assert.ok(
    response.body.some(
      (seat) => seat.seat_number === "101" && seat.floor === 1
    ),
    "Expected seat 101 on floor 1"
  );

  assert.ok(
    response.body.some(
      (seat) => seat.seat_number === "201" && seat.floor === 2
    ),
    "Expected seat 201 on floor 2"
  );

  assert.ok(
    response.body.some(
      (seat) => seat.seat_number === "301" && seat.floor === 3
    ),
    "Expected seat 301 on floor 3"
  );
});
