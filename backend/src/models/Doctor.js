const mongoose = require('mongoose');

const defaultSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
  maxCapacity: { type: Number, required: true, min: 1 },
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  defaultSlots: [defaultSlotSchema],
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
