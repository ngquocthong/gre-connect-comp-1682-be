const express = require('express');
const { 
  getAnswers, 
  createAnswer, 
  updateAnswer, 
  deleteAnswer,
  toggleUpvote
} = require('../controllers/answerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/question/:questionId', protect, getAnswers);

router.post('/question/:questionId', protect, createAnswer);

router.put('/:id', protect, updateAnswer);

router.delete('/:id', protect, deleteAnswer);

router.post('/:id/upvote', protect, toggleUpvote);

module.exports = router;

