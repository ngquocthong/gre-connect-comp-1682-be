const Question = require('../models/Question');
const Answer = require('../models/Answer');

class QuestionService {
  async getQuestions(filters = {}) {
    const { search, tags, status } = filters;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'banned') {
      query.isActive = false;
    }

    const questions = await Question.find(query)
      .populate('userId', 'firstName lastName profilePicture username role')
      .sort({ createdAt: -1 });

    const questionsWithAnswerCount = await Promise.all(
      questions.map(async (question) => {
        const answerCount = await Answer.countDocuments({ questionId: question._id });
        return {
          ...question.toObject(),
          answerCount
        };
      })
    );

    return questionsWithAnswerCount;
  }

  async getQuestionById(questionId) {
    const question = await Question.findById(questionId)
      .populate('userId', 'firstName lastName profilePicture username role');

    if (!question) {
      throw new Error('Question not found');
    }

    question.views += 1;
    await question.save();

    return question;
  }

  async createQuestion(userId, data) {
    const { title, content, tags, attachments } = data;

    const question = await Question.create({
      userId,
      title,
      content,
      tags: tags || [],
      attachments: attachments || []
    });

    await question.populate('userId', 'firstName lastName profilePicture username role');
    return question;
  }

  async updateQuestion(questionId, userId, updates) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.userId.toString() !== userId.toString()) {
      throw new Error('Can only edit own questions');
    }

    const { title, content, tags, attachments } = updates;

    if (title) question.title = title;
    if (content) question.content = content;
    if (tags) question.tags = tags;
    if (attachments) question.attachments = attachments;

    await question.save();
    await question.populate('userId', 'firstName lastName profilePicture username role');

    return question;
  }

  async deleteQuestion(questionId, userRole) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error('Question not found');
    }

    if (!['teacher', 'staff'].includes(userRole)) {
      throw new Error('Only teachers and staff can delete questions');
    }

    await Answer.deleteMany({ questionId: question._id });
    await question.deleteOne();
  }

  async toggleQuestionStatus(questionId, userRole) {
    const question = await Question.findById(questionId);

    if (!question) {
      throw new Error('Question not found');
    }

    if (!['teacher', 'staff'].includes(userRole)) {
      throw new Error('Only teachers and staff can ban questions');
    }

    question.isActive = !question.isActive;
    await question.save();

    return question;
  }
}

module.exports = new QuestionService();

