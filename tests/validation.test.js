
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { getTestToken } = require("./auth.helper");

test("POST /api/bookings rejects missing fields", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("POST /api/bookings rejects invalid IDs", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send({ seatId: -1 });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("POST /api/bookings rejects string IDs", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${token}`)
    .send({ seatId: "1" });

  assert.equal(response.status, 400);
});

test("GET /api/seats rejects an invalid seat ID", async () => {
  const response = await request(app).get("/api/seats/abc");

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Invalid seat ID");
});

test("GET /api/seats returns 404 for a nonexistent seat", async () => {
  const response = await request(app).get("/api/seats/999999");

  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Seat not found");
});

test("PATCH cancellation rejects an invalid booking ID", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .patch("/api/bookings/abc/cancel")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Invalid booking ID");
});

test("PATCH cancellation returns 404 for a nonexistent booking", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .patch("/api/bookings/999999/cancel")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Booking not found");
});
