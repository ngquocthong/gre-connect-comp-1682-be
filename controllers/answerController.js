const answerService = require('../services/answerService');
const fcmService = require('../services/fcmService');
const Question = require('../models/Question');

const getAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;
    const answers = await answerService.getAnswers(questionId);
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, attachments } = req.body;
    const answererId = req.user._id;

    const answer = await answerService.createAnswer(answererId, questionId, {
      content,
      attachments
    });

    // Send FCM notification to question owner (in background)
    sendAnswerNotification(answererId, questionId, req.user);

    res.status(201).json(answer);
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Cannot answer banned question') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Helper function to send FCM notification for new answer (runs in background)
const sendAnswerNotification = async (answererId, questionId, answerer) => {
  try {
    const question = await Question.findById(questionId).select('userId title');
    if (!question) return;

    // Don't notify if answering own question
    if (question.userId.toString() === answererId.toString()) return;

    const answererName = `${answerer.firstName} ${answerer.lastName}`;

    await fcmService.sendNewAnswerNotification(
      question.userId,
      answererName,
      question.title,
      questionId
    );
  } catch (error) {
    console.error('Error sending answer notification:', error.message);
  }
};

const updateAnswer = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const answer = await answerService.updateAnswer(req.params.id, req.user._id, {
      content,
      attachments
    });
    res.json(answer);
  } catch (error) {
    if (error.message === 'Answer not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Can only edit own answers') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteAnswer = async (req, res) => {
  try {
    await answerService.deleteAnswer(req.params.id, req.user._id, req.user.role);
    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    if (error.message === 'Answer not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const toggleUpvote = async (req, res) => {
  try {
    const answer = await answerService.toggleUpvote(req.params.id, req.user._id);
    res.json(answer);
  } catch (error) {
    if (error.message === 'Answer not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  toggleUpvote
};
