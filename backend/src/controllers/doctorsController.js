const Doctor = require('../models/Doctor');
const { asyncHandler, createError } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const { name, defaultSlots } = req.body;
  if (!name || !defaultSlots?.length) throw createError('name and defaultSlots required', 400);
  const doctor = await Doctor.create({ name, defaultSlots });
  res.status(201).json({ success: true, data: doctor });
});

exports.list = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().sort({ createdAt: -1 });
  res.json({ success: true, data: doctors });
});

exports.getById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw createError('Doctor not found', 404);
  res.json({ success: true, data: doctor });
});
