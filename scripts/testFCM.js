/**
 * Test FCM Push Notifications
 * Usage: node scripts/testFCM.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { initializeFirebase } = require('../config/firebase');
const fcmService = require('../services/fcmService');
const User = require('../models/User');

const testFCM = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Initialize Firebase
        initializeFirebase();
        console.log('✅ Firebase initialized');

        // Find a user with FCM token
        const user = await User.findOne({ fcmToken: { $exists: true, $ne: null } });

        if (!user) {
            console.log('❌ No user with FCM token found');
            console.log('');
            console.log('To add a test FCM token:');
            console.log('1. Login to get access token');
            console.log('2. PUT /api/auth/fcm-token with body: { "fcmToken": "fkVVtmGORSOPeK27aodQ2V:APA91bH82Hy7mBY2OIwuIMmWzxx9RW4dTBgUMAVL7J0QyXuKD6Jrl-22ZrTyrlGwJLa3RL5sEaDpsF6AjOF3-DrZlgHEiqS5x9t2RitZvu_n3bldUjoIVn8" }');
            console.log('');
            console.log('To get a real FCM token:');
            console.log('1. Run your React Native app');
            console.log('2. Use @react-native-firebase/messaging to get the token');
            console.log('3. Send it to the backend');
            process.exit(1);
        }

        console.log(`✅ Found user with FCM token: ${user.firstName} ${user.lastName}`);
        console.log(`   FCM Token: ${user.fcmToken.substring(0, 30)}...`);
        console.log('');

        // Test 1: Send simple notification
        console.log('📤 Sending test notification...');
        const result1 = await fcmService.sendPushNotification(user._id, {
            title: '🧪 Test Notification',
            body: 'This is a test notification from GreConnect backend!',
            data: {
                type: 'test',
                timestamp: new Date().toISOString()
            }
        });
        console.log('Result:', result1);
        console.log('');

        // Test 2: Send message notification
        console.log('📤 Sending message notification...');
        const result2 = await fcmService.sendNewMessageNotification(
            user._id,
            'Test Sender',
            'Hello! This is a test message notification.',
            '507f1f77bcf86cd799439011' // fake conversation ID
        );
        console.log('Result:', result2);
        console.log('');

        // Test 3: Send answer notification
        console.log('📤 Sending answer notification...');
        const result3 = await fcmService.sendNewAnswerNotification(
            user._id,
            'Test Answerer',
            'How to implement authentication in React Native?',
            '507f1f77bcf86cd799439012' // fake question ID
        );
        console.log('Result:', result3);
        console.log('');

        console.log('✅ All tests completed!');
        console.log('');
        console.log('If FCM token is valid, you should receive notifications on your device.');
        console.log('If token is invalid, check the error messages above.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

testFCM();

