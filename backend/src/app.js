require('dotenv').config();
const express = require('express');
const cors = require('cors');
const doctorsRouter = require('./routes/doctors');
const slotsRouter = require('./routes/slots');
const tokensRouter = require('./routes/tokens');
const simulationRouter = require('./routes/simulation');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/doctors', doctorsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/simulation', simulationRouter);

app.get('/health', (req, res) => res.json({ ok: true, service: 'opd-token-allocation-engine' }));

app.use(errorHandler);

module.exports = app;
