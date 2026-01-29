# OPD Token Allocation Engine — Documentation

## 1. Prioritization Logic

Tokens come from five sources. **Higher priority is served first** within each slot. Tie-break: **FIFO** (earlier `createdAt` first).

| Source      | Base priority | Use case                          |
|------------|---------------|-----------------------------------|
| `emergency`| 1000          | Emergency insertions              |
| `priority` | 400           | Paid priority patients            |
| `followup` | 300           | Follow-up patients                |
| `online`   | 200           | Online booking                    |
| `walkin`   | 100           | Walk-in (OPD desk)                |

- **Priority score** = `base × 100000 + (100000 - createdAt_tiebreak)` so that earlier timestamps get higher secondary score.
- **Sequence within slot** (`sequenceInSlot`) is recomputed after every allocation, cancel, no-show, or emergency so that the display order matches priority.

## 2. Per-Slot Hard Limits

- Each **slot** has a fixed `maxCapacity`. The count of **active** tokens (status `booked`, `waitlist`, `checked_in`, `in_consultation`) cannot exceed `maxCapacity`.
- When a slot is **full**, new tokens are created with status **`waitlist`** instead of `booked`. They are considered for promotion when capacity frees up.

## 3. Dynamic Reallocation

- **Cancel / No-show:** Token is marked `cancelled` or `no_show`. Capacity is freed. The engine then **promotes** the highest-priority waitlist token for that slot to `booked` (if any).
- **Promotion:** Among waitlist tokens for the slot, we pick the one with highest `priorityScore`, then earliest `createdAt`. Only one token is promoted per free slot; we then recompute `sequenceInSlot` for the slot.
- **Emergency:** Emergency tokens use the `emergency` source (highest priority). They are placed in the requested slot, or the first available same-day slot for the doctor if none is given. If the chosen slot is over capacity, the emergency token goes to **waitlist** (still with highest priority) and will be promoted first when space frees up.

## 4. Edge Cases

| Edge case | Handling |
|-----------|----------|
| **Slot full at booking** | New token is `waitlist`; no override of hard limit. |
| **Cancel / no-show on already terminal token** | Request rejected (already `cancelled` / `no_show` / `completed`). |
| **Emergency when all same-day slots full** | Emergency is added to waitlist of the first slot we use; still highest priority. |
| **Empty waitlist** | No promotion; capacity simply stays unused. |
| **Same priority + same time** | Tie-break by `_id` or natural order; implementation uses `createdAt` then insertion order. |
| **Generate slots for same doctor+date+time again** | Idempotent: we reuse existing slot if one exists. |
| **Date handling** | All slot dates are normalized to UTC midnight. `date` in APIs: `YYYY-MM-DD` or ISO string. |

## 5. Failure Handling

- **API errors:** Central `errorHandler` middleware returns JSON `{ success: false, error: message }` with appropriate HTTP status. `404` for not-found, `400` for validation/bad request.
- **Allocation failures:** E.g. “Slot not found”, “Token not found”, “Token already cancelled/no-show/completed”. These are thrown from the engine, caught by `asyncHandler`, and passed to `errorHandler`.
- **DB / connectivity:** MongoDB connection errors are logged; server exits on failed startup. Simulation script exits with code 1 on unhandled rejection.
- **Simulation:** Individual steps (allocate, cancel, no-show, emergency) are wrapped in try/catch; failures are recorded in the `log` array. Simulation continues so we can observe partial runs.

## 6. Trade-offs

- **Waitlist vs reject:** We **waitlist** when full instead of rejecting, to support elastic capacity (e.g. cancellations free space later). Trade-off: waitlist can grow if cancellations are rare.
- **Emergency in waitlist:** We do not “bump” lower-priority tokens. Emergency can go to waitlist if over capacity. Trade-off: simpler, predictable behaviour; bumping would require explicit rules and extra state.
- **Single promotion per event:** One cancel/no-show frees one slot, so we promote at most one waitlist token. Batched reallocation could be added later if needed.
- **Sequence recompute:** We recompute `sequenceInSlot` for the affected slot on every change. Cost is O(n) in slot size; acceptable for typical OPD slot sizes.
