const questionService = require('../services/questionService');

const getQuestions = async (req, res) => {
  try {
    const { search, tags, status } = req.query;
    const questions = await questionService.getQuestions({ search, tags, status });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuestion = async (req, res) => {
  try {
    const question = await questionService.getQuestionById(req.params.id);
    res.json(question);
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { title, content, tags, attachments } = req.body;
    const question = await questionService.createQuestion(req.user._id, {
      title,
      content,
      tags,
      attachments
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { title, content, tags, attachments } = req.body;
    const question = await questionService.updateQuestion(req.params.id, req.user._id, {
      title,
      content,
      tags,
      attachments
    });
    res.json(question);
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Can only edit own questions') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    await questionService.deleteQuestion(req.params.id, req.user.role);
    res.json({ message: 'Question and answers deleted successfully' });
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Only teachers and staff can delete questions') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const toggleQuestionStatus = async (req, res) => {
  try {
    const question = await questionService.toggleQuestionStatus(req.params.id, req.user.role);
    res.json(question);
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Only teachers and staff can ban questions') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus
};
