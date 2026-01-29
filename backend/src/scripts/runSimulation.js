/**
 * CLI simulation: connect DB, run one OPD day (3+ doctors), log result, exit.
 * Usage: npm run simulation
 * Optional: DATE=2025-01-30 npm run simulation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { runSimulationLogic } = require('../controllers/simulationController');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opd-token-engine';
const DATE = process.env.DATE || new Date().toISOString().slice(0, 10);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected\n');
  try {
    const result = await runSimulationLogic({ date: DATE });
    console.log('=== OPD Day Simulation ===');
    console.log('Date:', result.date);
    console.log('Doctors:', result.doctors.length, result.doctors.map(d => d.name).join(', '));
    console.log('Slots:', result.slotsCount);
    console.log('\n--- Summary (status × source) ---');
    console.log(JSON.stringify(result.summary, null, 2));
    console.log('\n--- Events (sample) ---');
    result.log.slice(0, 15).forEach(e => console.log(JSON.stringify(e)));
    console.log('\n--- Tokens sample ---');
    result.tokensSample.slice(0, 8).forEach(t => console.log(JSON.stringify(t)));
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
