# SeatLock — Smart Seat Reservation System

A full-stack seat reservation platform that enables users to explore seat availability, reserve seats, and manage their bookings through a web interface.

**Live Demo:** https://seatlock-frontend.vercel.app/  
**Repository:** https://github.com/ghostab6712/SeatLock

---

## Overview

SeatLock is a full-stack web application built to simplify seat reservation and prevent conflicting bookings. It combines a Next.js frontend with a Node.js and Express backend, using PostgreSQL for persistent data storage.

The application provides user authentication, a floor-based seat selection interface, and booking management through REST APIs.

## Features

- **User Authentication:** Register and log in to access the reservation system.
- **Interactive Seat Map:** Browse seats and view their availability.
- **Multi-Floor Layout:** Explore 300 seats distributed across three floors.
- **Seat Reservation:** Reserve available seats through the application.
- **Booking Management:** View bookings and cancel existing reservations.
- **Persistent Storage:** Store users, seats, and booking records in PostgreSQL.
- **Booking Integrity:** Use database constraints to prevent conflicting active reservations.
- **REST API:** Separate backend endpoints for seats and bookings.
- **Cloud Deployment:** Frontend hosted on Vercel and backend hosted on Render.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| API Communication | REST, JSON |
| Authentication | JWT-based authentication |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

## System Architecture

```text
                    User
                     |
                     v
          Next.js Frontend
             (Vercel)
                     |
                REST API
                     |
                     v
          Express.js Backend
              (Render)
                     |
                     v
              PostgreSQL
        Users | Seats | Bookings
```

The frontend sends HTTP requests to the backend API. The backend validates requests, applies booking rules, and interacts with PostgreSQL to retrieve or update application data.

## Seat Layout

The current deployment contains 300 seats distributed across three floors.

| Floor | Seat Range | Number of Seats |
|---|---|---:|
| Floor 1 | 101–200 | 100 |
| Floor 2 | 201–300 | 100 |
| Floor 3 | 301–400 | 100 |
| **Total** | **101–400** | **300** |

Each seat has an availability status that the application uses to determine whether it can be reserved.

## Application Workflow

1. A user registers an account or logs in.
2. The frontend requests seat data from the backend.
3. The user explores the available floors and seats.
4. The user selects an available seat and submits a reservation.
5. The backend validates the request and persists the booking.
6. The user can review or cancel their bookings.

Database constraints help protect against multiple active bookings for the same seat.

## Project Structure

```text
SeatLock/
├── src/
│   ├── app.js
│   ├── server.js
│   └── ...
├── tests/
│   └── seats.test.js
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   ├── login/
│   │   ├── register/
│   │   └── bookings/
│   ├── package.json
│   └── next.config.ts
├── package.json
├── schema.sql
└── README.md
```

The backend is maintained at the repository root, while the Next.js frontend resides in `frontend/`.

## Getting Started

### Prerequisites

Install the following before running the application locally:

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ghostab6712/SeatLock.git
cd SeatLock
```

### 2. Configure the Backend

Install the backend dependencies:

```bash
npm install
```

Create a `.env` file in the repository root and configure the required environment variables:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=seatlock
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_secure_random_secret

FRONTEND_URL=http://localhost:3001
```

Use your own local PostgreSQL credentials and a securely generated JWT secret. Never commit `.env` files or production secrets to GitHub.

### 3. Set Up the Database

Create a PostgreSQL database named `seatlock`, then execute the database schema provided in the repository.

```bash
psql -U your_postgres_username -d seatlock -f schema.sql
```

If your local setup requires initial seat records, populate the seats table according to the schema and seat layout.

### 4. Start the Backend

```bash
npm run dev
```

If the development script is unavailable, use the configured production entry point:

```bash
npm start
```

The backend will run on the port configured in your environment.

### 5. Configure the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` with the backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

The frontend must use the same backend port configured in the previous step.

### 6. Start the Frontend

```bash
npm run dev
```

Open the local URL printed by Next.js in your terminal. If your local setup uses port `3001`, visit:

```text
http://localhost:3001
```

## API Overview

The backend exposes REST endpoints for health checks, seat information, authentication, and booking operations.

| Endpoint | Purpose |
|---|---|
| `GET /health` | Check backend health |
| `GET /health/ready` | Check application readiness |
| `GET /api/seats` | Retrieve seat information |
| `/api/bookings` | Access booking operations |

Registration, login, booking creation, and cancellation are handled through their respective backend routes. Consult the source code for exact HTTP methods, request bodies, and authentication requirements.

## Testing

Run the backend test suite from the repository root:

```bash
node --test
```

The tests help validate backend behavior and API functionality. Additional integration tests should be run against a dedicated test database rather than production data.

## Deployment

SeatLock is deployed using the following services:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend API | Render |
| Database | PostgreSQL hosted on Render |

### Deployment Configuration

- Configure `NEXT_PUBLIC_API_URL` in Vercel to point to the deployed backend.
- Configure `FRONTEND_URL` in Render to match the deployed frontend origin.
- Set the production database connection variables and `JWT_SECRET` securely in Render.
- Redeploy the relevant service after changing environment variables.
- Verify the health endpoint, seat API, registration, login, and booking operations after deployment.

## Security Considerations

- Keep database credentials and JWT secrets outside version control.
- Validate incoming requests on the backend.
- Restrict cross-origin requests to trusted frontend origins.
- Enforce booking constraints at the database level.
- Avoid exposing sensitive user information in API responses or logs.

## Future Improvements

- Real-time seat availability updates.
- Booking expiration and temporary seat locks.
- An administrative dashboard for managing seats and reservations.
- Booking history and usage analytics.
- Improved concurrency handling and automated integration testing.
- Notifications for booking confirmation and cancellation.

## Author

**Abhay Rathore**

GitHub: https://github.com/ghostab6712

---

*SeatLock is a full-stack project focused on API development, database-backed reservation workflows, authentication, and cloud deployment.*
