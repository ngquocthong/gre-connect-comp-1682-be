const Answer = require('../models/Answer');
const Question = require('../models/Question');

class AnswerService {
  async getAnswers(questionId) {
    const answers = await Answer.find({ questionId })
      .populate('authorId', 'firstName lastName profilePicture username role')
      .sort({ createdAt: 1 });

    return answers;
  }

  async createAnswer(userId, questionId, data) {
    const { content, attachments } = data;

    const question = await Question.findById(questionId);
    
    if (!question) {
      throw new Error('Question not found');
    }

    if (!question.isActive) {
      throw new Error('Cannot answer banned question');
    }

    const answer = await Answer.create({
      questionId,
      authorId: userId,
      content,
      attachments: attachments || []
    });

    await answer.populate('authorId', 'firstName lastName profilePicture username role');
    return answer;
  }

  async updateAnswer(answerId, userId, updates) {
    const answer = await Answer.findById(answerId);

    if (!answer) {
      throw new Error('Answer not found');
    }

    if (answer.authorId.toString() !== userId.toString()) {
      throw new Error('Can only edit own answers');
    }

    const { content, attachments } = updates;

    if (content) answer.content = content;
    if (attachments) answer.attachments = attachments;

    await answer.save();
    await answer.populate('authorId', 'firstName lastName profilePicture username role');

    return answer;
  }

  async deleteAnswer(answerId, userId, userRole) {
    const answer = await Answer.findById(answerId);

    if (!answer) {
      throw new Error('Answer not found');
    }

    if (answer.authorId.toString() !== userId.toString() && 
        !['teacher', 'staff'].includes(userRole)) {
      throw new Error('Access denied');
    }

    await answer.deleteOne();
  }

  async toggleUpvote(answerId, userId) {
    const answer = await Answer.findById(answerId);

    if (!answer) {
      throw new Error('Answer not found');
    }

    const hasUpvoted = answer.reactions.some(id => id.toString() === userId.toString());

    if (hasUpvoted) {
      answer.reactions = answer.reactions.filter(id => id.toString() !== userId.toString());
      answer.upvotes = Math.max(0, answer.upvotes - 1);
    } else {
      answer.reactions.push(userId);
      answer.upvotes += 1;
    }

    await answer.save();
    await answer.populate('authorId', 'firstName lastName profilePicture username role');

    return answer;
  }
}

module.exports = new AnswerService();

