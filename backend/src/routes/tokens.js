const express = require('express');
const tokensController = require('../controllers/tokensController');

const router = express.Router();

router.post('/', tokensController.create);
router.post('/emergency', tokensController.emergency);
router.get('/', tokensController.list);
router.get('/:id', tokensController.getById);
router.patch('/:id/cancel', tokensController.cancel);
router.post('/:id/no-show', tokensController.markNoShow);

module.exports = router;
