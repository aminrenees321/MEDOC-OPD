const Slot = require('../models/Slot');
const { generateSlotsForDate, toDateOnly } = require('../services/slotService');
const { asyncHandler, createError } = require('../middleware/errorHandler');

exports.generate = asyncHandler(async (req, res) => {
  const { date, doctorId } = req.body;
  if (!date) throw createError('date required (YYYY-MM-DD)', 400);
  const slots = await generateSlotsForDate(date, doctorId || null);
  res.status(201).json({ success: true, data: slots });
});

exports.list = asyncHandler(async (req, res) => {
  const { date, doctorId } = req.query;
  const filter = {};
  if (date) {
    const start = toDateOnly(date);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.date = { $gte: start, $lt: end };
  }
  if (doctorId) filter.doctor = doctorId;
  const slots = await Slot.find(filter)
    .populate('doctor', 'name')
    .sort({ date: 1, startTime: 1 });
  res.json({ success: true, data: slots });
});

exports.getById = asyncHandler(async (req, res) => {
  const slot = await Slot.findById(req.params.id).populate('doctor');
  if (!slot) throw createError('Slot not found', 404);
  res.json({ success: true, data: slot });
});
