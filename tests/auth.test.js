
const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { getTestToken } = require("./auth.helper");

test("registration rejects missing fields", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("registration rejects a password shorter than 8 characters", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "short-password@example.com",
      password: "abc123",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("registration rejects an empty email", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "   ",
      password: "ValidPass123!",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("registration rejects a duplicate email", async () => {
  const token = await getTestToken();

  const meResponse = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(meResponse.status, 200);

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: meResponse.body.data.email,
      password: "AnotherPass123!",
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
});

test("login rejects missing credentials", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("login rejects an incorrect password", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "testuser1@example.com",
      password: "DefinitelyWrong123!",
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("login rejects an unknown email", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "unknown-seatlock-user@example.com",
      password: "SomePassword123!",
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("login succeeds and returns a token", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "testuser1@example.com",
      password: "SeatLockTest123!",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.data.token, "string");
  assert.ok(response.body.data.token.length > 0);
  assert.equal(response.body.data.user.email, "testuser1@example.com");
});

test("GET /api/auth/me rejects requests without a token", async () => {
  const response = await request(app).get("/api/auth/me");

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("GET /api/auth/me returns the authenticated user", async () => {
  const token = await getTestToken();

  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.email, "testuser1@example.com");
});

test("registration rejects an invalid email format", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email: "not-an-email",
      password: "ValidPass123!",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("registration accepts a valid email format", async () => {
  const email = `valid.${Date.now()}@example.com`;

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password: "ValidPass123!",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.email, email);
});
