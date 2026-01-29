/**
 * Slot generation: create daily slots from Doctor defaultSlots for a given date.
 */

const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

/**
 * Normalize date to start of day UTC.
 * Accepts Date, or string "YYYY-MM-DD" (parsed as UTC).
 */
function toDateOnly(d) {
  const date = d instanceof Date ? new Date(d) : new Date(String(d).trim().split('T')[0] + 'T00:00:00.000Z');
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/**
 * Generate slots for a date.
 * @param {string|Date} date - OPD date (e.g. "2025-01-29" or Date)
 * @param {string} [doctorId] - If provided, only this doctor; otherwise all doctors.
 * @returns {Promise<Slot[]>} Created/found slots.
 */
async function generateSlotsForDate(date, doctorId = null) {
  const dateOnly = toDateOnly(date);
  const doctors = doctorId
    ? await Doctor.find({ _id: doctorId })
    : await Doctor.find({});

  if (!doctors.length) throw new Error('No doctors found');

  const slots = [];
  for (const doc of doctors) {
    if (!doc.defaultSlots || !doc.defaultSlots.length) continue;
    for (const ds of doc.defaultSlots) {
      const existing = await Slot.findOne({
        doctor: doc._id,
        date: dateOnly,
        startTime: ds.startTime,
        endTime: ds.endTime,
      });
      if (existing) {
        slots.push(existing);
        continue;
      }
      const slot = await Slot.create({
        doctor: doc._id,
        date: dateOnly,
        startTime: ds.startTime,
        endTime: ds.endTime,
        maxCapacity: ds.maxCapacity,
      });
      slots.push(slot);
    }
  }
  return slots;
}

module.exports = { generateSlotsForDate, toDateOnly };
