const express = require('express');
const doctorsController = require('../controllers/doctorsController');

const router = express.Router();

router.post('/', doctorsController.create);
router.get('/', doctorsController.list);
router.get('/:id', doctorsController.getById);

module.exports = router;
