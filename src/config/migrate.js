require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const pool = require("./db");

const migrationsDirectory = path.join(
  __dirname,
  "../../migrations"
);

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => /^\d+.*\.sql$/.test(file))
    .sort();

  for (const filename of files) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Prevent concurrent migration runners from applying
      // the same migration at the same time.
      await client.query(
        "SELECT pg_advisory_xact_lock($1, $2)",
        [74821, 1]
      );

      const existing = await client.query(
        "SELECT filename FROM schema_migrations WHERE filename = $1",
        [filename]
      );

      if (existing.rowCount > 0) {
        await client.query("COMMIT");
        console.log(`Already applied: ${filename}`);
        continue;
      }

      const filePath = path.join(
        migrationsDirectory,
        filename
      );

      const sql = fs.readFileSync(filePath, "utf8");

      await client.query(sql);

      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [filename]
      );

      await client.query("COMMIT");

      console.log(`Applied: ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("Database migrations complete.");
}

runMigrations()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });