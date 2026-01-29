const Token = require('../models/Token');
const Slot = require('../models/Slot');
const { toDateOnly } = require('../services/slotService');
const allocationEngine = require('../services/allocationEngine');
const { SOURCES, STATUSES } = require('../models/Token');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const validSources = Object.values(SOURCES).filter(s => s !== SOURCES.EMERGENCY);

exports.create = asyncHandler(async (req, res) => {
  const { slotId, patientName, phone, source } = req.body;
  if (!slotId || !patientName || !source) throw createError('slotId, patientName, source required', 400);
  if (!validSources.includes(source)) throw createError(`source must be one of: ${validSources.join(', ')}`, 400);
  const token = await allocationEngine.allocateToken({ slotId, patientName, phone, source });
  const populated = await Token.findById(token._id).populate('slot');
  res.status(201).json({ success: true, data: populated });
});

exports.list = asyncHandler(async (req, res) => {
  const { slotId, doctorId, date, status } = req.query;
  const filter = {};
  if (slotId) filter.slot = slotId;
  if (status) filter.status = status;
  if (doctorId || date) {
    const slotFilter = {};
    if (doctorId) slotFilter.doctor = doctorId;
    if (date) {
      const start = toDateOnly(date);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      slotFilter.date = { $gte: start, $lt: end };
    }
    const slots = await Slot.find(slotFilter).select('_id');
    filter.slot = { $in: slots.map(s => s._id) };
  }
  const tokens = await Token.find(filter)
    .populate('slot')
    .sort({ priorityScore: -1, createdAt: 1 });
  res.json({ success: true, data: tokens });
});

exports.getById = asyncHandler(async (req, res) => {
  const token = await Token.findById(req.params.id).populate('slot');
  if (!token) throw createError('Token not found', 404);
  res.json({ success: true, data: token });
});

exports.cancel = asyncHandler(async (req, res) => {
  const { token, promoted } = await allocationEngine.cancelToken(req.params.id);
  res.json({ success: true, data: { token, promoted } });
});

exports.markNoShow = asyncHandler(async (req, res) => {
  const { token, promoted } = await allocationEngine.markNoShow(req.params.id);
  res.json({ success: true, data: { token, promoted } });
});

exports.emergency = asyncHandler(async (req, res) => {
  const { doctorId, date, slotId, patientName, phone, reason } = req.body;
  if (!doctorId || !date || !patientName) throw createError('doctorId, date, patientName required', 400);
  const token = await allocationEngine.addEmergency({
    doctorId,
    date,
    slotId: slotId || null,
    patientName,
    phone: phone || null,
    reason: reason || null,
  });
  const populated = await Token.findById(token._id).populate('slot');
  res.status(201).json({ success: true, data: populated });
});
