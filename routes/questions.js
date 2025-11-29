const express = require('express');
const { 
  getQuestions, 
  getQuestion, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  toggleQuestionStatus
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', protect, getQuestions);

router.get('/:id', protect, getQuestion);

router.post('/', protect, createQuestion);

router.put('/:id', protect, updateQuestion);

router.delete('/:id', protect, checkRole('teacher', 'staff'), deleteQuestion);

router.patch('/:id/toggle-status', protect, checkRole('teacher', 'staff'), toggleQuestionStatus);

module.exports = router;

