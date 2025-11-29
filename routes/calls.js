const express = require('express');
const { 
  initiateCall, 
  joinCall, 
  endCall,
  getCallHistory
} = require('../controllers/callController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/initiate', protect, initiateCall);

router.post('/:id/join', protect, joinCall);

router.post('/:id/end', protect, endCall);

router.get('/history/:conversationId', protect, getCallHistory);

module.exports = router;

