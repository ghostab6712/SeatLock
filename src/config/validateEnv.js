
const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
];

function validateEnv() {
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`
    );
  }

  const dbPort = Number(process.env.DB_PORT);

  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
    throw new Error("DB_PORT must be a valid port number");
  }

  if (process.env.PORT !== undefined) {
    const appPort = Number(process.env.PORT);

    if (
      !Number.isInteger(appPort) ||
      appPort < 1 ||
      appPort > 65535
    ) {
      throw new Error("PORT must be a valid port number");
    }
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
}

module.exports = validateEnv;
