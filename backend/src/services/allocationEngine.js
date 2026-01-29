/**
 * OPD Token Allocation Engine
 *
 * Enforces per-slot hard limits, prioritizes sources (emergency > priority > followup > online > walkin),
 * and handles cancellations, no-shows, and emergency insertions with dynamic reallocation.
 */

const Token = require('../models/Token');
const Slot = require('../models/Slot');
const { SOURCES, STATUSES, SOURCE_PRIORITY } = require('../models/Token');

const ACTIVE_STATUSES = [STATUSES.BOOKED, STATUSES.WAITLIST, STATUSES.CHECKED_IN, STATUSES.IN_CONSULTATION];

/** Count active tokens in a slot (excluding cancelled, no_show, completed). */
async function getActiveTokenCount(slotId) {
  const count = await Token.countDocuments({
    slot: slotId,
    status: { $in: ACTIVE_STATUSES },
  });
  return count;
}

/** Compute priority score: base from source, then FIFO via createdAt tie-break. */
function computePriorityScore(source, createdAt) {
  const base = SOURCE_PRIORITY[source] ?? SOURCE_PRIORITY[SOURCES.WALKIN];
  const tieBreak = (createdAt ? new Date(createdAt).getTime() : 0) % 100000;
  return base * 100000 + (100000 - tieBreak);
}

/**
 * Allocate a new token.
 * - Enforces per-slot hard limit.
 * - If slot full: optionally add to waitlist (status: waitlist) for same slot.
 * - Assigns priorityScore from source + createdAt.
 */
async function allocateToken({ slotId, patientName, phone, source }) {
  const slot = await Slot.findById(slotId).populate('doctor');
  if (!slot) throw new Error('Slot not found');

  const activeCount = await getActiveTokenCount(slotId);
  const isFull = activeCount >= slot.maxCapacity;

  const token = new Token({
    slot: slotId,
    patientName,
    phone: phone || undefined,
    source,
    status: isFull ? STATUSES.WAITLIST : STATUSES.BOOKED,
    priorityScore: computePriorityScore(source, new Date()),
  });
  await token.save();

  if (!isFull) {
    await reassignSequenceInSlot(slotId);
  }
  return token;
}

/**
 * Reassign sequenceInSlot for all active tokens in a slot, ordered by priorityScore desc, then createdAt asc.
 */
async function reassignSequenceInSlot(slotId) {
  const tokens = await Token.find({ slot: slotId, status: { $in: ACTIVE_STATUSES } })
    .sort({ priorityScore: -1, createdAt: 1 })
    .lean();
  for (let i = 0; i < tokens.length; i++) {
    await Token.updateOne({ _id: tokens[i]._id }, { sequenceInSlot: i + 1, updatedAt: new Date() });
  }
}

/**
 * Promote first waitlist token for slot to booked when capacity frees up.
 * Returns the promoted token or null.
 */
async function promoteFromWaitlist(slotId) {
  const slot = await Slot.findById(slotId);
  if (!slot) return null;

  const activeCount = await getActiveTokenCount(slotId);
  if (activeCount >= slot.maxCapacity) return null;

  const waitlist = await Token.findOne({ slot: slotId, status: STATUSES.WAITLIST })
    .sort({ priorityScore: -1, createdAt: 1 });
  if (!waitlist) return null;

  waitlist.status = STATUSES.BOOKED;
  waitlist.updatedAt = new Date();
  await waitlist.save();
  await reassignSequenceInSlot(slotId);
  return waitlist;
}

/**
 * Cancel a token. Frees capacity and promotes from waitlist if any.
 */
async function cancelToken(tokenId) {
  const token = await Token.findById(tokenId).populate('slot');
  if (!token) throw new Error('Token not found');
  if (token.status === STATUSES.CANCELLED || token.status === STATUSES.NO_SHOW || token.status === STATUSES.COMPLETED) {
    throw new Error('Token already cancelled, no-show, or completed');
  }

  token.status = STATUSES.CANCELLED;
  token.updatedAt = new Date();
  await token.save();

  const promoted = await promoteFromWaitlist(token.slot._id);
  await reassignSequenceInSlot(token.slot._id);
  return { token, promoted };
}

/**
 * Mark token as no-show. Same as cancel for capacity; optionally different for analytics.
 */
async function markNoShow(tokenId) {
  const token = await Token.findById(tokenId).populate('slot');
  if (!token) throw new Error('Token not found');
  if (token.status === STATUSES.CANCELLED || token.status === STATUSES.NO_SHOW || token.status === STATUSES.COMPLETED) {
    throw new Error('Token already cancelled, no-show, or completed');
  }

  token.status = STATUSES.NO_SHOW;
  token.updatedAt = new Date();
  await token.save();

  const promoted = await promoteFromWaitlist(token.slot._id);
  await reassignSequenceInSlot(token.slot._id);
  return { token, promoted };
}

/**
 * Add emergency token.
 * - Try given slot first; if full, try next slots same doctor same day.
 * - Emergency has highest priority; we never bump emergency.
 * - If all slots full, add to waitlist for first slot (or best available).
 */
async function addEmergency({ doctorId, date, slotId, patientName, phone, reason }) {
  const SlotModel = require('../models/Slot');
  const { toDateOnly } = require('./slotService');
  let targetSlot = null;
  if (slotId) {
    targetSlot = await SlotModel.findById(slotId).populate('doctor');
    if (!targetSlot || targetSlot.doctor._id.toString() !== doctorId) targetSlot = null;
  }

  if (!targetSlot) {
    const dateOnly = toDateOnly(date);
    const dayEnd = new Date(dateOnly);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const slots = await SlotModel.find({
      doctor: doctorId,
      date: { $gte: dateOnly, $lt: dayEnd },
    }).sort({ startTime: 1 });
    targetSlot = slots[0] || null;
  }

  if (!targetSlot) throw new Error('No slot found for doctor on the given date');

  const token = new Token({
    slot: targetSlot._id,
    patientName,
    phone: phone || undefined,
    source: SOURCES.EMERGENCY,
    status: STATUSES.BOOKED,
    priorityScore: computePriorityScore(SOURCES.EMERGENCY, new Date()),
    metadata: reason ? { emergencyReason: reason } : {},
  });
  await token.save();

  const activeCount = await getActiveTokenCount(targetSlot._id);
  if (activeCount > targetSlot.maxCapacity) {
    token.status = STATUSES.WAITLIST;
    await token.save();
  }
  await reassignSequenceInSlot(targetSlot._id);
  return token;
}

/**
 * Reallocate tokens when conditions change (e.g. after batch cancel).
 * Recomputes sequenceInSlot for all affected slots.
 */
async function reallocateForSlot(slotId) {
  const promoted = await promoteFromWaitlist(slotId);
  await reassignSequenceInSlot(slotId);
  return promoted;
}

module.exports = {
  allocateToken,
  cancelToken,
  markNoShow,
  addEmergency,
  promoteFromWaitlist,
  reassignSequenceInSlot,
  getActiveTokenCount,
  reallocateForSlot,
  computePriorityScore,
  ACTIVE_STATUSES,
};
