
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SeatLock API",
      version: "1.0.0",
      description:
        "API documentation for SeatLock, a seat booking backend.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Invalid request" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
          },
        },
        Seat: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            seat_number: { type: "string", example: "A1" },
            is_available: { type: "boolean", example: true },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "integer", example: 12 },
            seatId: { type: "integer", example: 1 },
            seatNumber: { type: "string", example: "A1" },
            userId: { type: "integer", example: 3 },
            status: {
              type: "string",
              enum: ["confirmed", "cancelled"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Health"],
          summary: "Check whether the API is responding",
          responses: {
            200: {
              description: "API is responding",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "SeatLock backend is running",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/health": {
        get: {
          tags: ["Health"],
          summary: "Check API liveness",
          responses: {
            200: {
              description: "API is responding",
            },
          },
        },
      },

      "/health/ready": {
        get: {
          tags: ["Health"],
          summary: "Check database readiness",
          responses: {
            200: { description: "Database is reachable" },
            503: { description: "Database is unavailable" },
          },
        },
      },

      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "user@example.com",
                    },
                    password: {
                      type: "string",
                      minLength: 8,
                      example: "ExamplePass123!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Invalid email or password" },
            409: { description: "Email already registered" },
            500: { description: "Internal server error" },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Log in and obtain a JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "user@example.com",
                    },
                    password: {
                      type: "string",
                      example: "ExamplePass123!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful; returns a JWT" },
            400: { description: "Missing credentials" },
            401: { description: "Invalid email or password" },
            500: { description: "Internal server error" },
          },
        },
      },

      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get the authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Authenticated user returned" },
            401: { description: "Missing, invalid, or expired token" },
          },
        },
      },

      "/api/seats": {
        get: {
          tags: ["Seats"],
          summary: "List seats and their current availability",
          responses: {
            200: {
              description: "Seat list returned",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Seat" },
                  },
                },
              },
            },
            500: { description: "Internal server error" },
          },
        },
      },

      "/api/seats/{id}": {
        get: {
          tags: ["Seats"],
          summary: "Get a seat by ID",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            200: {
              description: "Seat returned",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Seat" },
                },
              },
            },
            400: { description: "Invalid seat ID" },
            404: { description: "Seat not found" },
            500: { description: "Internal server error" },
          },
        },
      },

      "/api/bookings": {
        get: {
          tags: ["Bookings"],
          summary: "List the authenticated user's bookings",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "User's bookings returned",
            },
            401: { description: "Authentication required" },
            500: { description: "Internal server error" },
          },
        },
        post: {
          tags: ["Bookings"],
          summary: "Book an available seat",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["seatId"],
                  properties: {
                    seatId: {
                      type: "integer",
                      minimum: 1,
                      example: 1,
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Booking created successfully" },
            400: { description: "Invalid seat ID" },
            401: { description: "Authentication required" },
            404: { description: "Seat not found" },
            409: { description: "Seat is already booked" },
            500: { description: "Internal server error" },
          },
        },
      },

      "/api/bookings/{id}": {
        get: {
          tags: ["Bookings"],
          summary: "Get a booking owned by the authenticated user",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            200: { description: "Booking returned" },
            400: { description: "Invalid booking ID" },
            401: { description: "Authentication required" },
            404: { description: "Booking not found" },
            500: { description: "Internal server error" },
          },
        },
      },

      "/api/bookings/{id}/cancel": {
        patch: {
          tags: ["Bookings"],
          summary: "Cancel a booking owned by the authenticated user",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            200: { description: "Booking cancelled successfully" },
            400: { description: "Invalid booking ID" },
            401: { description: "Authentication required" },
            404: { description: "Booking not found" },
            409: { description: "Booking is already cancelled" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
