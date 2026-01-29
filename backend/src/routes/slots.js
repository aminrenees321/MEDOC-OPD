const express = require('express');
const slotsController = require('../controllers/slotsController');

const router = express.Router();

router.post('/generate', slotsController.generate);
router.get('/', slotsController.list);
router.get('/:id', slotsController.getById);

module.exports = router;
