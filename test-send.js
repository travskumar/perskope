// scripts/test-send.js
import PeriskopeClient from '../src/periskope-client.js';

async function testSend() {
  console.log('🚀 Testing WhatsApp message sending...\n');
  
  const client = new PeriskopeClient();
  const testChatId = '917060284729@c.us'; // Your target chat ID
  
  try {
    // Test 1: Send a simple message
    console.log(`📤 Sending test message to ${testChatId}...`);
    const result = await client.sendMessage(
      testChatId, 
      'Hello! This is a test message from Periskope MCP integration. Time: ' + new Date().toLocaleString()
    );
    
    if (result.success) {
      console.log('✅ Message sent successfully!');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Failed to send message');
    }
    
    // Test 2: Get chats to verify connection
    console.log('\n📱 Getting chats to verify connection...');
    const chats = await client.getChats();
    console.log(`✅ Found ${chats.data?.chats?.length || chats.data?.length || 0} chats`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testSend();