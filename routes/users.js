const express = require('express');
const { 
  getUsers, 
  getUser, 
  updateUser, 
  toggleUserStatus, 
  deleteUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateFcmToken,
  removeFcmToken
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', protect, checkRole('staff'), getUsers);

router.get('/pending', protect, checkRole('staff'), getPendingUsers);

router.get('/:id', protect, getUser);

router.put('/:id', protect, checkRole('staff'), updateUser);

router.patch('/:id/toggle-status', protect, checkRole('staff'), toggleUserStatus);

router.delete('/:id', protect, checkRole('staff'), deleteUser);

router.post('/:id/approve', protect, checkRole('staff'), approveUser);

router.post('/:id/reject', protect, checkRole('staff'), rejectUser);

// FCM token management routes
router.post('/fcm-token', protect, updateFcmToken);

router.delete('/fcm-token', protect, removeFcmToken);

module.exports = router;

