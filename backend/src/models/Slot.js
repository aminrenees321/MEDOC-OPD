const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true }, // OPD date (YYYY-MM-DD)
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  maxCapacity: { type: Number, required: true, min: 1 },
}, { timestamps: true });

slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
