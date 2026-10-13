require("dotenv").config();

const validateEnv = require("./config/validateEnv");
validateEnv();

const app = require("./app");
const pool = require("./config/db");

const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
  console.log(`SeatLock backend listening on port ${port}`);
});

let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async (serverError) => {
    if (serverError) {
      console.error("Error closing HTTP server:", serverError);
      process.exitCode = 1;
    }

    try {
      await pool.end();
      console.log("Database connection pool closed.");
    } catch (error) {
      console.error("Error closing database pool:", error.message);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));