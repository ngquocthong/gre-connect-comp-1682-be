require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const Resource = require('../models/Resource');
const Event = require('../models/Event');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      firstName: 'Admin',
      lastName: 'Staff',
      username: 'admin',
      email: 'admin@greconnect.edu',
      password: 'Admin123!',
      role: 'staff',
      isActive: true,
      isPending: false,
      bio: 'System administrator'
    },
    {
      firstName: 'John',
      lastName: 'Teacher',
      username: 'teacher1',
      email: 'teacher1@greconnect.edu',
      password: 'Teacher123!',
      role: 'teacher',
      isActive: true,
      isPending: false,
      bio: 'Computer Science Teacher'
    },
    {
      firstName: 'Alice',
      lastName: 'Student',
      username: 'student1',
      email: 'student1@greconnect.edu',
      password: 'Student123!',
      role: 'student',
      isActive: true,
      isPending: false,
      bio: 'Computer Science Student'
    },
    {
      firstName: 'Bob',
      lastName: 'Student',
      username: 'student2',
      email: 'student2@greconnect.edu',
      password: 'Student123!',
      role: 'student',
      isActive: true,
      isPending: false,
      bio: 'Engineering Student'
    },
    {
      firstName: 'Charlie',
      lastName: 'Pending',
      username: 'pending1',
      email: 'pending1@student.edu',
      password: 'Pending123!',
      role: 'student',
      isActive: false,
      isPending: true,
      bio: 'Awaiting approval'
    }
  ];

  await User.deleteMany({});
  const createdUsers = await User.create(users);
  console.log('Users seeded:', createdUsers.length);
  return createdUsers;
};

const seedQuestions = async (users) => {
  const studentUser = users.find(u => u.role === 'student' && u.isActive);

  const questions = [
    {
      userId: studentUser._id,
      title: 'How to implement Firebase Authentication?',
      content: 'I am building a React Native app and need help setting up Firebase Auth with email/password. What are the steps?',
      tags: ['firebase', 'react-native', 'authentication'],
      views: 42,
      isActive: true
    },
    {
      userId: studentUser._id,
      title: 'Best practices for MongoDB schema design?',
      content: 'What are the recommended approaches for designing MongoDB schemas for a messaging application?',
      tags: ['mongodb', 'database', 'schema-design'],
      views: 28,
      isActive: true
    },
    {
      userId: studentUser._id,
      title: 'Socket.IO vs WebSocket?',
      content: 'What are the differences between Socket.IO and native WebSocket? Which one should I use for real-time chat?',
      tags: ['socket.io', 'websocket', 'real-time'],
      views: 35,
      isActive: true
    }
  ];

  await Question.deleteMany({});
  const createdQuestions = await Question.create(questions);
  console.log('Questions seeded:', createdQuestions.length);
  return createdQuestions;
};

const seedResources = async (users) => {
  const teacherUser = users.find(u => u.role === 'teacher');

  const resources = [
    {
      uploadedBy: teacherUser._id,
      title: 'Introduction to Algorithms - Lecture Notes',
      description: 'Comprehensive notes covering sorting, searching, and graph algorithms',
      type: 'document',
      url: 'https://example.com/algorithms-notes.pdf',
      tags: ['algorithms', 'computer-science'],
      downloads: 15,
      views: 45
    },
    {
      uploadedBy: teacherUser._id,
      title: 'React Native Tutorial Series',
      description: 'Complete video series on building mobile apps with React Native',
      type: 'video',
      url: 'https://example.com/react-native-tutorial',
      tags: ['react-native', 'mobile-development'],
      downloads: 8,
      views: 32
    },
    {
      uploadedBy: teacherUser._id,
      title: 'MongoDB Documentation',
      description: 'Official MongoDB documentation and guides',
      type: 'link',
      url: 'https://docs.mongodb.com',
      tags: ['mongodb', 'database', 'documentation'],
      downloads: 0,
      views: 21
    }
  ];

  await Resource.deleteMany({});
  const createdResources = await Resource.create(resources);
  console.log('Resources seeded:', createdResources.length);
  return createdResources;
};

const seedEvents = async (users) => {
  const teacherUser = users.find(u => u.role === 'teacher');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const events = [
    {
      createdBy: teacherUser._id,
      title: 'Midterm Examination - Computer Science',
      description: 'Topics: Data Structures, Algorithms, OOP',
      date: nextWeek,
      startTime: '09:00',
      endTime: '11:00',
      location: 'Room 301',
      type: 'academic',
      recurrence: 'none',
      participants: [teacherUser._id]
    },
    {
      createdBy: teacherUser._id,
      title: 'Data Structures Lecture',
      description: 'Weekly lecture on data structures',
      date: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      location: 'Room 205',
      type: 'academic',
      recurrence: 'weekly',
      participants: [teacherUser._id]
    },
    {
      createdBy: teacherUser._id,
      title: 'Student Club Meeting',
      description: 'Monthly meeting for computer science club',
      date: nextWeek,
      startTime: '17:00',
      endTime: '18:30',
      location: 'Student Center',
      type: 'social',
      recurrence: 'monthly',
      participants: [teacherUser._id]
    }
  ];

  await Event.deleteMany({});
  const createdEvents = await Event.create(events);
  console.log('Events seeded:', createdEvents.length);
  return createdEvents;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Starting database seed...');

    const users = await seedUsers();
    await seedQuestions(users);
    await seedResources(users);
    await seedEvents(users);

    console.log('Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('Staff: admin@greconnect.edu / Admin123!');
    console.log('Teacher: teacher1@greconnect.edu / Teacher123!');
    console.log('Student: student1@greconnect.edu / Student123!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

