require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Resource = require('../models/Resource');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Call = require('../models/Call');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing database...');

    await Promise.all([
      User.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Question.deleteMany({}),
      Answer.deleteMany({}),
      Resource.deleteMany({}),
      Event.deleteMany({}),
      Notification.deleteMany({}),
      Call.deleteMany({})
    ]);

    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();

