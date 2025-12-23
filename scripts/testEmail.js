require('dotenv').config();
const mongoose = require('mongoose');
const emailService = require('../services/emailService');

const testEmail = async () => {
  try {
    // Initialize email service
    emailService.initialize();
    console.log('✅ Email service initialized');
    console.log('');

    // Test recipient email (change this to your email)
    const testEmail = process.argv[2] || 'test@example.com';
    
    console.log(`📧 Sending test emails to: ${testEmail}`);
    console.log('');

    // Create a mock user object
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      username: 'testuser',
      role: 'student'
    };

    // Test 1: Welcome Email
    console.log('📤 Sending Welcome Email...');
    const result1 = await emailService.sendWelcomeEmail(mockUser);
    console.log('Result:', result1);
    console.log('');

    // Test 2: Password Reset Email
    console.log('📤 Sending Password Reset Email...');
    const mockResetToken = 'test-reset-token-123456789';
    const result2 = await emailService.sendPasswordResetEmail(mockUser, mockResetToken);
    console.log('Result:', result2);
    console.log('');

    // Test 3: Account Approved Email
    console.log('📤 Sending Account Approved Email...');
    const result3 = await emailService.sendAccountApprovedEmail(mockUser);
    console.log('Result:', result3);
    console.log('');

    // Test 4: Account Rejected Email
    console.log('📤 Sending Account Rejected Email...');
    const result4 = await emailService.sendAccountRejectedEmail(mockUser, 'Account information could not be verified.');
    console.log('Result:', result4);
    console.log('');

    console.log('✅ All test emails sent!');
    console.log('');
    console.log('Check your inbox for the test emails.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
console.log('='.repeat(50));
console.log('GreConnect Email Service Test');
console.log('='.repeat(50));
console.log('');

if (!process.env.SENDGRID_API_KEY) {
  console.log('⚠️  SENDGRID_API_KEY not found in environment');
  console.log('');
  console.log('To test emails, add to your .env file:');
  console.log('  SENDGRID_API_KEY=your_api_key_here');
  console.log('  SENDGRID_FROM_EMAIL=noreply@yourdomain.com');
  console.log('  SENDGRID_FROM_NAME=GreConnect');
  console.log('');
  console.log('Running in disabled mode (no emails will be sent)...');
  console.log('');
}

console.log('Usage: npm run test:email [recipient@email.com]');
console.log('');

testEmail();

