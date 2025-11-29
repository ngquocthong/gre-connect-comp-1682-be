const express = require('express');
const { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', protect, getEvents);

router.get('/:id', protect, getEvent);

router.post('/', protect, checkRole('teacher', 'staff'), createEvent);

router.put('/:id', protect, checkRole('teacher', 'staff'), updateEvent);

router.delete('/:id', protect, checkRole('teacher', 'staff'), deleteEvent);

module.exports = router;

