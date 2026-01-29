# OPD Token Allocation Engine

Hospital OPD token allocation system with **elastic capacity management**: fixed time slots per doctor, per-slot hard limits, multiple token sources (online, walk-in, priority, follow-up, emergency), and handling of cancellations, no-shows, and emergency insertions.

## Features

- **Per-slot hard limits** — No overbooking; waitlist when full.
- **Dynamic reallocation** — Cancel/no-show frees capacity and promotes from waitlist.
- **Prioritization** — Emergency > Priority > Follow-up > Online > Walk-in; FIFO within same source.
- **Cancellations & no-shows** — Dedicated endpoints; engine updates counts and promotes waitlist.
- **Emergency insertions** — Highest priority; placed in requested or first same-day slot; waitlist if over capacity.
- **Simulation** — One OPD day with ≥ 3 doctors: seed data, allocate, cancel, no-show, emergency.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React, React Router, Axios

## Setup

### Backend

1. **Navigate to backend**

   ```bash
   cd MEDOC/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment**

   - Copy `backend/.env.example` to `backend/.env`.
   - Set `MONGODB_URI` (already configured with MongoDB Atlas).
   - Optionally set `PORT` (default: `5000`).

4. **MongoDB**

   - MongoDB Atlas connection is configured in `.env`.
   - Ensure network access is allowed in MongoDB Atlas.

### Frontend

1. **Navigate to frontend**

   ```bash
   cd MEDOC/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment**

   - The `.env` file is already configured with `REACT_APP_API_URL=http://localhost:5000`.
   - Update if backend runs on a different port.

## Run

### Backend

- **Start API server**

  ```bash
  cd backend
  npm run dev
  ```

  Server runs at `http://localhost:5000`.

- **Run simulation (CLI)**

  ```bash
  cd backend
  npm run simulation
  ```

  Optional: `DATE=2025-01-30 npm run simulation` to use a specific date.

### Frontend

- **Start React app**

  ```bash
  cd frontend
  npm start
  ```

  App runs at `http://localhost:3000`.

  **Note:** Ensure backend is running on port 5000 before starting the frontend.

### Using the Frontend

The React app provides a complete UI for:

- **Dashboard:** Overview of doctors, slots, and tokens
- **Doctors:** Create and manage doctors with default slots
- **Slots:** Generate and view daily slots, filter by date/doctor
- **Tokens:** Create tokens (online/walk-in/priority/follow-up), emergency tokens, cancel/no-show tokens
- **Simulation:** Run OPD day simulation and view results

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/doctors` | Create doctor |
| GET | `/api/doctors` | List doctors |
| GET | `/api/doctors/:id` | Get doctor |
| POST | `/api/slots/generate` | Generate slots for date |
| GET | `/api/slots` | List slots (filter by date, doctorId) |
| GET | `/api/slots/:id` | Get slot |
| POST | `/api/tokens` | Allocate token (online/walkin/priority/followup) |
| POST | `/api/tokens/emergency` | Add emergency token |
| GET | `/api/tokens` | List tokens |
| GET | `/api/tokens/:id` | Get token |
| PATCH | `/api/tokens/:id/cancel` | Cancel token |
| POST | `/api/tokens/:id/no-show` | Mark no-show |
| POST | `/api/simulation/run` | Run OPD day simulation |

See **[docs/API_DESIGN.md](docs/API_DESIGN.md)** for request/response schemas and **[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)** for prioritization, edge cases, and failure handling.

## Project Structure

```
MEDOC/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Doctors, Slots, Tokens, Simulation
│   │   ├── middleware/   # Error handler
│   │   ├── models/       # Doctor, Slot, Token
│   │   ├── routes/       # API routes
│   │   ├── services/     # Allocation engine, slot generation
│   │   └── scripts/      # runSimulation.js (CLI)
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/        # Dashboard, Doctors, Slots, Tokens, Simulation
│   │   ├── services/     # API service layer
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── docs/
│   ├── API_DESIGN.md
│   └── DOCUMENTATION.md
└── README.md
```

## License

MIT.
