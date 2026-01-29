require('dotenv').config();
const express = require('express');
const cors = require('cors');
const doctorsRouter = require('./routes/doctors');
const slotsRouter = require('./routes/slots');
const tokensRouter = require('./routes/tokens');
const simulationRouter = require('./routes/simulation');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// CORS: allow Netlify frontend + localhost for dev
const allowedOrigins = [
  'https://medoc-opd.netlify.app',
  'http://localhost:3000',
];
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
}));
app.use(express.json());

app.use('/api/doctors', doctorsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/simulation', simulationRouter);

app.get('/', (req, res) => {
  res.json({
    service: 'OPD Token Allocation Engine',
    status: 'running',
    version: '1.0.0',
    docs: {
      health: '/health',
      api: '/api',
      doctors: '/api/doctors',
      slots: '/api/slots',
      tokens: '/api/tokens',
      simulation: '/api/simulation/run',
    },
  });
});

app.get('/health', (req, res) => res.json({ ok: true, service: 'opd-token-allocation-engine' }));

app.use(errorHandler);

module.exports = app;
