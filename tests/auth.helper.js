
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

async function getTestToken() {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "testuser1@example.com",
      password: "SeatLockTest123!",
    });

  assert.equal(
    response.status,
    200,
    "Test account login must succeed"
  );

  return response.body.data.token;
}

module.exports = { getTestToken };
