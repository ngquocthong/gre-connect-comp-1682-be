const express = require('express');
const { body } = require('express-validator');
const { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', protect, getEvents);

router.get('/:id', protect, getEvent);

router.post('/', protect, checkRole('teacher', 'staff'), [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format (24-hour)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('type')
    .optional()
    .isIn(['academic', 'social', 'sports', 'other'])
    .withMessage('Type must be one of: academic, social, sports, other'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #3b82f6)'),
  body('recurrence')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Recurrence must be one of: none, daily, weekly, monthly'),
  validateRequest
], createEvent);

router.put('/:id', protect, checkRole('teacher', 'staff'), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format (24-hour)'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format (24-hour)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must not exceed 200 characters'),
  body('type')
    .optional()
    .isIn(['academic', 'social', 'sports', 'other'])
    .withMessage('Type must be one of: academic, social, sports, other'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #3b82f6)'),
  body('recurrence')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Recurrence must be one of: none, daily, weekly, monthly'),
  validateRequest
], updateEvent);

router.delete('/:id', protect, checkRole('teacher', 'staff'), deleteEvent);

module.exports = router;

