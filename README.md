# OPD Token Allocation Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A hospital OPD token allocation system with **elastic capacity management** — fixed time slots per doctor, per-slot hard limits, multiple token sources, and dynamic handling of cancellations, no-shows, and emergency insertions.

---

## Live Demo

| | Link |
|---|------|
| **Frontend** | [https://medoc-opd.netlify.app](https://medoc-opd.netlify.app) |
| **Backend API** | [https://medoc-opd.onrender.com](https://medoc-opd.onrender.com) |
| **Health Check** | [https://medoc-opd.onrender.com/health](https://medoc-opd.onrender.com/health) |

> **Quick Start:** Open the [Frontend](https://medoc-opd.netlify.app) → Go to **Slots** → Click **Quick Setup** to create sample doctors and slots.

---

## Features

| Feature | Description |
|---------|-------------|
| **Per-slot hard limits** | No overbooking; full slots use a waitlist |
| **Dynamic reallocation** | Cancel/no-show frees capacity and promotes from waitlist |
| **Prioritization** | Emergency > Priority > Follow-up > Online > Walk-in |
| **Token sources** | Online booking, walk-in, paid priority, follow-up, emergency |
| **Simulation** | One OPD day with ≥ 3 doctors, cancellations, no-shows, emergencies |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, React Router, Axios |
| **Backend** | Node.js, Express |
| **Database** | MongoDB, Mongoose |
| **Deployment** | Netlify (frontend), Render (backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit .env with your MONGODB_URI
npm run dev
```

Server runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # REACT_APP_API_URL=http://localhost:5000
npm start
```

App runs at `http://localhost:3000`.

---

## Project Structure

```
MEDOC/
├── backend/           # Express API
│   ├── src/
│   │   ├── config/    # DB connection
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/    # Doctor, Slot, Token
│   │   ├── routes/
│   │   └── services/  # Allocation engine
│   └── server.js
├── frontend/          # React SPA
│   ├── src/
│   │   ├── pages/     # Dashboard, Doctors, Slots, Tokens, Simulation
│   │   └── services/   # API client
│   └── public/
├── docs/
│   ├── API_DESIGN.md
│   └── DOCUMENTATION.md
└── README.md
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/doctors` | Create doctor |
| GET | `/api/doctors` | List doctors |
| POST | `/api/slots/generate` | Generate slots for date |
| GET | `/api/slots` | List slots |
| POST | `/api/tokens` | Create token |
| POST | `/api/tokens/emergency` | Add emergency token |
| PATCH | `/api/tokens/:id/cancel` | Cancel token |
| POST | `/api/tokens/:id/no-show` | Mark no-show |
| POST | `/api/simulation/run` | Run OPD day simulation |

See [docs/API_DESIGN.md](docs/API_DESIGN.md) and [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for details.

---

## License

MIT
