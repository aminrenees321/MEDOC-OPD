# OPD Token Allocation Engine — API Design

## Base URL

- Local: `http://localhost:5000`
- All API routes are prefixed with `/api`.

---

## Data Schema

### Doctor

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `name` | string | Doctor name |
| `defaultSlots` | array | Slots repeated each OPD day |
| `createdAt`, `updatedAt` | Date | Timestamps |

**defaultSlots** entry:

| Field | Type | Description |
|-------|------|-------------|
| `startTime` | string | e.g. `"09:00"` |
| `endTime` | string | e.g. `"10:00"` |
| `maxCapacity` | number | Max tokens per slot |

### Slot (daily instance)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `doctor` | ObjectId | Ref `Doctor` |
| `date` | Date | OPD date (UTC midnight) |
| `startTime` | string | e.g. `"09:00"` |
| `endTime` | string | e.g. `"10:00"` |
| `maxCapacity` | number | From doctor’s defaultSlot |
| `createdAt`, `updatedAt` | Date | Timestamps |

### Token

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto-generated |
| `slot` | ObjectId | Ref `Slot` |
| `patientName` | string | Required |
| `phone` | string | Optional |
| `source` | enum | `online` \| `walkin` \| `priority` \| `followup` \| `emergency` |
| `status` | enum | `booked` \| `waitlist` \| `checked_in` \| `in_consultation` \| `completed` \| `cancelled` \| `no_show` |
| `priorityScore` | number | Computed |
| `sequenceInSlot` | number | Display order in slot |
| `metadata` | object | Optional (e.g. `emergencyReason`) |
| `createdAt`, `updatedAt` | Date | Timestamps |

---

## Endpoints

### Health

- **GET** `/health`  
  - Response: `{ ok: true, service: "opd-token-allocation-engine" }`

---

### Doctors

- **POST** `/api/doctors`  
  - Body: `{ name: string, defaultSlots: [{ startTime, endTime, maxCapacity }] }`  
  - Response: `{ success: true, data: Doctor }`

- **GET** `/api/doctors`  
  - Response: `{ success: true, data: Doctor[] }`

- **GET** `/api/doctors/:id`  
  - Response: `{ success: true, data: Doctor }`

---

### Slots

- **POST** `/api/slots/generate`  
  - Body: `{ date: "YYYY-MM-DD", doctorId?: ObjectId }`  
  - Creates daily slots from `defaultSlots` for the given date (all doctors or one).  
  - Response: `{ success: true, data: Slot[] }`

- **GET** `/api/slots`  
  - Query: `date` (YYYY-MM-DD), `doctorId`  
  - Response: `{ success: true, data: Slot[] }`

- **GET** `/api/slots/:id`  
  - Response: `{ success: true, data: Slot }`

---

### Tokens

- **POST** `/api/tokens`  
  - Body: `{ slotId, patientName, source, phone? }`  
  - `source`: `online` \| `walkin` \| `priority` \| `followup` (no `emergency` here).  
  - Response: `{ success: true, data: Token }`  
  - Allocation engine enforces capacity; may create `waitlist` token.

- **POST** `/api/tokens/emergency`  
  - Body: `{ doctorId, date, patientName, slotId?, phone?, reason? }`  
  - `date`: `YYYY-MM-DD`.  
  - Response: `{ success: true, data: Token }`

- **GET** `/api/tokens`  
  - Query: `slotId`, `doctorId`, `date`, `status`  
  - Response: `{ success: true, data: Token[] }`

- **GET** `/api/tokens/:id`  
  - Response: `{ success: true, data: Token }`

- **PATCH** `/api/tokens/:id/cancel`  
  - Response: `{ success: true, data: { token, promoted } }`  
  - `promoted`: waitlist token moved to `booked`, or `null`.

- **POST** `/api/tokens/:id/no-show`  
  - Response: `{ success: true, data: { token, promoted } }`  
  - Same shape as cancel.

---

### Simulation

- **POST** `/api/simulation/run`  
  - Body: `{ date?: "YYYY-MM-DD" }`  
  - Ensures ≥ 3 doctors, generates slots for the date, allocates tokens, simulates cancel / no-show / emergency.  
  - Response: `{ success: true, data: { date, doctors, slotsCount, log, summary, bySlot, tokensSample } }`

---

## Error Response

- Format: `{ success: false, error: string }`
- Status: `400` validation / bad request, `404` not found, `500` server error.
