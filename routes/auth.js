const express = require('express');
const { body } = require('express-validator');
const { 
  register, 
  login, 
  forgotPassword, 
  getProfile, 
  updateProfile, 
  changePassword,
  updateFCMToken
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post('/register', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('username').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validateRequest
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validateRequest
], login);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
  validateRequest
], forgotPassword);

router.get('/profile', protect, getProfile);

router.put('/profile', protect, updateProfile);

router.put('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  validateRequest
], changePassword);

router.put('/fcm-token', protect, updateFCMToken);

module.exports = router;

