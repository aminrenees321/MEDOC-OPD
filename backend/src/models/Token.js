const mongoose = require('mongoose');

const SOURCES = Object.freeze({
  ONLINE: 'online',
  WALKIN: 'walkin',
  PRIORITY: 'priority',
  FOLLOWUP: 'followup',
  EMERGENCY: 'emergency',
});

const STATUSES = Object.freeze({
  BOOKED: 'booked',
  WAITLIST: 'waitlist',
  CHECKED_IN: 'checked_in',
  IN_CONSULTATION: 'in_consultation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
});

// Priority base scores (higher = served first). Emergency highest, walk-in lowest.
const SOURCE_PRIORITY = Object.freeze({
  [SOURCES.EMERGENCY]: 1000,
  [SOURCES.PRIORITY]: 400,
  [SOURCES.FOLLOWUP]: 300,
  [SOURCES.ONLINE]: 200,
  [SOURCES.WALKIN]: 100,
});

const tokenSchema = new mongoose.Schema({
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  patientName: { type: String, required: true },
  phone: { type: String },
  source: { type: String, enum: Object.values(SOURCES), required: true },
  status: { type: String, enum: Object.values(STATUSES), default: STATUSES.BOOKED },
  priorityScore: { type: Number, required: true }, // computed from source + order
  sequenceInSlot: { type: Number }, // 1, 2, 3... within slot for display
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed }, // e.g. { emergencyReason, bumpedFromSlot }
}, { timestamps: true });

tokenSchema.index({ slot: 1, status: 1 });
tokenSchema.index({ slot: 1, priorityScore: -1, createdAt: 1 });

module.exports = mongoose.model('Token', tokenSchema);
module.exports.SOURCES = SOURCES;
module.exports.STATUSES = STATUSES;
module.exports.SOURCE_PRIORITY = SOURCE_PRIORITY;
