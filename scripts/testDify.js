/**
 * Test script for Dify AI integration
 * Run: npm run test:dify
 */

require('dotenv').config();
const difyService = require('../services/difyService');

async function testDify() {
  console.log('='.repeat(60));
  console.log('🤖 Dify AI Integration Test');
  console.log('='.repeat(60));
  console.log('');

  // Initialize service
  difyService.initialize();
  console.log('');

  // Test connection
  const connectionTest = await difyService.testConnection();
  console.log('');

  if (!connectionTest.success) {
    console.log('❌ Connection test failed. Please check:');
    console.log('   1. DIFY_API_KEY is correct');
    console.log('   2. DIFY_BASE_URL is correct (default: https://api.dify.ai/v1)');
    console.log('   3. DIFY_APP_TYPE is correct (chatflow or workflow)');
    console.log('');
    console.log('Your current .env settings:');
    console.log(`   DIFY_API_KEY=${process.env.DIFY_API_KEY ? 'SET (starts with: ' + process.env.DIFY_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`   DIFY_BASE_URL=${process.env.DIFY_BASE_URL || 'NOT SET (using default)'}`);
    console.log(`   DIFY_APP_TYPE=${process.env.DIFY_APP_TYPE || 'NOT SET (using chatflow)'}`);
    return;
  }

  // Test sending a message
  console.log('📤 Sending test message...');
  const testMessage = 'Xin chào, bạn có thể giúp tôi không?';
  console.log(`   Message: "${testMessage}"`);
  console.log('');

  const result = await difyService.sendChatMessage({
    query: testMessage,
    userId: 'test-user-123',
    conversationId: '',
    inputs: {}
  });

  if (result.success) {
    console.log('✅ AI Response received!');
    console.log('-'.repeat(60));
    console.log('Answer:', result.answer);
    console.log('-'.repeat(60));
    console.log('');
    console.log('Metadata:');
    console.log('  - Conversation ID:', result.conversationId || result.workflowRunId || 'N/A');
    console.log('  - Message ID:', result.messageId || result.taskId || 'N/A');
    if (result.metadata?.retrieverResources?.length > 0) {
      console.log('  - Knowledge Sources:');
      result.metadata.retrieverResources.forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.documentName} (score: ${r.score})`);
      });
    }
    if (result.metadata?.outputs) {
      console.log('  - Workflow Outputs:', JSON.stringify(result.metadata.outputs, null, 2));
    }
  } else {
    console.log('❌ Failed to get AI response:');
    console.log('   Error:', result.error);
    console.log('   Message:', result.message);
    if (result.details) {
      console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
    console.log('');
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Check if API Key is correct (click "API Key" in Dify dashboard)');
    console.log('   2. Make sure the app is published and "IN SERVICE"');
    console.log('   3. For Workflow apps, set DIFY_APP_TYPE=workflow in .env');
    console.log('   4. Enable debug mode: DIFY_DEBUG=true in .env');
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Test completed!');
  console.log('='.repeat(60));
}

testDify().catch(console.error);

