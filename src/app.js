const cors = require("cors");
const express = require("express");
const pool = require("./config/db");
const app = express();
const helmet = require("helmet");
const seatsRouter = require("./routes/seats.routes");
const bookingsRouter = require("./routes/bookings.routes");
const authRouter = require("./routes/auth.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(express.json());
// Liveness: the API process is responding.
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "ok",
  });
});

// Readiness: the database is reachable.
app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      success: true,
      status: "ready",
      database: "connected",
    });
  } catch (error) {
    console.error("Database readiness check failed:", error.message);

    return res.status(503).json({
      success: false,
      status: "not_ready",
      message: "Service temporarily unavailable",
    });
  }
});
app.get("/", (req, res) => {
  res.json({ message: "SeatLock backend is running" });
});

app.use("/api/seats", seatsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/auth", authRouter);

// Handle requests that don't match any route.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Handle errors passed to Express error middleware.
app.use((err, req, res, next) => {
  console.error("Unhandled request error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

module.exports = app;
