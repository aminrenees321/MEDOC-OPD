const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const Token = require('../models/Token');
const { generateSlotsForDate, toDateOnly } = require('../services/slotService');
const allocationEngine = require('../services/allocationEngine');
const { SOURCES, STATUSES } = require('../models/Token');
const { asyncHandler, createError } = require('../middleware/errorHandler');

/**
 * Run one OPD day simulation with at least 3 doctors.
 * Seeds doctors + slots, creates tokens from multiple sources,
 * simulates cancellations, no-shows, emergency insertions.
 */
async function runSimulationLogic(opts = {}) {
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const dateOnly = toDateOnly(date);

  const existingDoctors = await Doctor.find();
  let doctors = existingDoctors;

  if (doctors.length < 3) {
    const toCreate = 3 - doctors.length;
    const defaults = [
      { name: 'Dr. Rajesh Kumar', defaultSlots: [{ startTime: '09:00', endTime: '10:00', maxCapacity: 5 }, { startTime: '10:00', endTime: '11:00', maxCapacity: 5 }, { startTime: '11:00', endTime: '12:00', maxCapacity: 5 }] },
      { name: 'Dr. Priya Nair', defaultSlots: [{ startTime: '09:00', endTime: '10:00', maxCapacity: 4 }, { startTime: '10:00', endTime: '11:00', maxCapacity: 4 }] },
      { name: 'Dr. Suresh Menon', defaultSlots: [{ startTime: '10:00', endTime: '11:00', maxCapacity: 6 }, { startTime: '11:00', endTime: '12:00', maxCapacity: 6 }] },
    ];
    for (let i = 0; i < toCreate; i++) {
      const d = await Doctor.create(defaults[i]);
      doctors.push(d);
    }
    doctors = await Doctor.find().sort({ createdAt: -1 }).limit(3);
  }

  await generateSlotsForDate(dateOnly, null);
  const slots = await Slot.find({ date: { $gte: dateOnly, $lt: new Date(dateOnly.getTime() + 86400000) } })
    .populate('doctor')
    .sort({ 'doctor.name': 1, startTime: 1 });

  const log = [];
  const tokenIds = [];

  for (const slot of slots) {
    const sources = [SOURCES.ONLINE, SOURCES.WALKIN, SOURCES.PRIORITY, SOURCES.FOLLOWUP];
    for (let i = 0; i < slot.maxCapacity; i++) {
      const source = sources[i % sources.length];
      try {
        const t = await allocationEngine.allocateToken({
          slotId: slot._id,
          patientName: `Patient-${slot.doctor.name}-${slot.startTime}-${i + 1}`,
          phone: '9876543210',
          source,
        });
        tokenIds.push({ id: t._id, slotId: slot._id, source });
        log.push({ action: 'allocate', source, slot: `${slot.doctor.name} ${slot.startTime}-${slot.endTime}`, tokenId: t._id });
      } catch (e) {
        log.push({ action: 'allocate_failed', error: e.message, slot: `${slot.doctor.name} ${slot.startTime}` });
      }
    }
  }

  const toCancel = tokenIds.filter(t => t.source === SOURCES.ONLINE).slice(0, 2);
  for (const t of toCancel) {
    try {
      const { promoted } = await allocationEngine.cancelToken(t.id);
      log.push({ action: 'cancel', tokenId: t.id, promoted: promoted ? promoted._id : null });
    } catch (e) {
      log.push({ action: 'cancel_failed', tokenId: t.id, error: e.message });
    }
  }

  const toNoShow = tokenIds.filter(t => t.source === SOURCES.WALKIN).slice(0, 1);
  for (const t of toNoShow) {
    try {
      const { promoted } = await allocationEngine.markNoShow(t.id);
      log.push({ action: 'no_show', tokenId: t.id, promoted: promoted ? promoted._id : null });
    } catch (e) {
      log.push({ action: 'no_show_failed', tokenId: t.id, error: e.message });
    }
  }

  const firstDoctor = doctors[0];
  const firstSlot = slots.find(s => s.doctor && s.doctor._id.toString() === firstDoctor._id.toString());
  if (firstSlot) {
    try {
      const em = await allocationEngine.addEmergency({
        doctorId: firstDoctor._id,
        date: dateOnly.toISOString().slice(0, 10),
        slotId: firstSlot._id,
        patientName: 'Emergency Patient Alpha',
        phone: '9999999999',
        reason: 'Simulated emergency',
      });
      log.push({ action: 'emergency', tokenId: em._id, slot: `${firstSlot.doctor.name} ${firstSlot.startTime}-${firstSlot.endTime}` });
    } catch (e) {
      log.push({ action: 'emergency_failed', error: e.message });
    }
  }

  const summary = await Token.aggregate([
    { $match: { slot: { $in: slots.map(s => s._id) } } },
    { $group: { _id: { status: '$status', source: '$source' }, count: { $sum: 1 } } },
  ]);

  const bySlot = await Token.aggregate([
    { $match: { slot: { $in: slots.map(s => s._id) }, status: { $in: [STATUSES.BOOKED, STATUSES.WAITLIST, STATUSES.CHECKED_IN, STATUSES.IN_CONSULTATION, STATUSES.COMPLETED] } } },
    { $group: { _id: '$slot', count: { $sum: 1 } } },
  ]);

  return {
    date: dateOnly.toISOString().slice(0, 10),
    doctors: doctors.map(d => ({ id: d._id, name: d.name })),
    slotsCount: slots.length,
    log,
    summary,
    bySlot,
    tokensSample: (await Token.find({ slot: { $in: slots.map(s => s._id) } })
      .limit(20)
      .populate({ path: 'slot', populate: { path: 'doctor', select: 'name' } })).map(t => ({
      id: t._id,
      patientName: t.patientName,
      source: t.source,
      status: t.status,
      slot: t.slot ? `${t.slot.doctor?.name || '?'} ${t.slot.startTime}-${t.slot.endTime}` : null,
    })),
  };
}

exports.run = asyncHandler(async (req, res) => {
  const { date } = req.body || {};
  const result = await runSimulationLogic({ date: date || new Date().toISOString().slice(0, 10) });
  res.json({ success: true, data: result });
});

module.exports.runSimulationLogic = runSimulationLogic;
