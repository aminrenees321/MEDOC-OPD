const express = require('express');
const simulationController = require('../controllers/simulationController');

const router = express.Router();

router.post('/run', simulationController.run);

module.exports = router;
