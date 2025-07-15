// scripts/test-connection.js
import PeriskopeClient from '../src/periskope-client.js';

async function testConnection() {
  console.log('🔍 Testing Periskope connection...');
  console.log('📋 Configuration:');
  console.log('- API Key:', process.env.PERISKOPE_API_KEY ? `✅ Present (${process.env.PERISKOPE_API_KEY.substring(0, 10)}...)` : '❌ Missing');
  console.log('- Phone ID:', process.env.PERISKOPE_PHONE_ID ? '✅ Present' : '❌ Missing');
  console.log('- Phone Number:', process.env.PERISKOPE_PHONE_NUMBER ? '✅ Present' : '❌ Missing');
  
  const client = new PeriskopeClient();
  
  // Test 1: Check if client initializes properly
  console.log('\n🔧 Testing client initialization...');
  try {
    console.log('✅ Client initialized successfully');
  } catch (error) {
    console.error('❌ Client initialization failed:', error.message);
    return;
  }
  
  // Test 2: Get all chats first to see what's available
  console.log('\n📱 Testing get all chats...');
  try {
    const chats = await client.getChats();
    console.log('✅ Chats retrieved successfully:');
    console.log('Raw response:', JSON.stringify(chats, null, 2));
    
    // Try different ways to access the data
    const chatList = chats.data?.chats || chats.chats || chats.data || [];
    const chatCount = chatList.length || chats.data?.count || chats.count || 'Unknown';
    console.log(`- Total chats: ${chatCount}`);
    
    // Show first few chats
    if (Array.isArray(chatList) && chatList.length > 0) {
      console.log('\nFirst 3 chats:');
      chatList.slice(0, 3).forEach(chat => {
        console.log(`  - ${chat.chat_name} (${chat.chat_id}) - Type: ${chat.chat_type}`);
      });
      
      // Store first chat ID for testing
      const firstChatId = chatList[0].chat_id;
      
      // Test 3: Send message to first available chat
      console.log(`\n📨 Testing send message to ${firstChatId}...`);
      try {
        const messageResult = await client.sendMessage(firstChatId, 'Test message from Periskope MCP Integration');
        console.log('✅ Message sent successfully:', messageResult);
      } catch (error) {
        console.log('❌ Send message failed:', error.message);
      }
      
      // Test 4: Get specific chat details
      console.log(`\n🔍 Testing get chat by ID for ${firstChatId}...`);
      try {
        const chatDetails = await client.getChatById(firstChatId);
        console.log('✅ Chat details retrieved:', {
          name: chatDetails.data?.chat_name,
          type: chatDetails.data?.chat_type,
          memberCount: chatDetails.data?.member_count
        });
      } catch (error) {
        console.log('❌ Get chat by ID failed:', error.message);
      }
      
      // Test 5: Get chat messages
      console.log(`\n💬 Testing get chat messages for ${firstChatId}...`);
      try {
        const messages = await client.getChatMessages(firstChatId);
        console.log('✅ Messages retrieved:', {
          count: messages.data?.messages?.length || messages.data?.count || 'Unknown',
          from: messages.data?.from,
          to: messages.data?.to
        });
      } catch (error) {
        console.log('❌ Get chat messages failed:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Get chats failed:', error.message);
    
    // If official client fails, try direct API
    console.log('\n🔄 Trying direct API call to get chats...');
    try {
      const directResult = await client.makeDirectAPICall('/chats', 'GET');
      console.log('✅ Direct API call successful:', directResult);
    } catch (directError) {
      console.log('❌ Direct API call also failed:', directError.message);
    }
  }
  
  // Test 6: Get only group chats
  console.log('\n👥 Testing get group chats...');
  try {
    const groups = await client.getChats('group');
    console.log('✅ Group chats retrieved:', groups.data?.chats?.length || groups.data?.count || 'Unknown');
  } catch (error) {
    console.log('❌ Get group chats failed:', error.message);
  }
  
  // Test 7: Get all messages
  console.log('\n📨 Testing get all messages...');
  try {
    const allMessages = await client.getAllMessages();
    console.log('✅ All messages retrieved:', {
      count: allMessages.data?.messages?.length || allMessages.data?.count || 'Unknown'
    });
  } catch (error) {
    console.log('❌ Get all messages failed:', error.message);
  }
  
  // Test 8: Send a test message to your specified chat ID
  console.log('\n📤 Testing send message to 917060284729@c.us...');
  try {
    const testMessage = await client.sendMessage('917060284729@c.us', 'Hello from Periskope MCP! This is a test message.');
    console.log('✅ Test message sent successfully:', testMessage);
  } catch (error) {
    console.log('❌ Failed to send test message:', error.message);
    console.log('Full error:', error);
  }
  
  console.log('\n🏁 Connection test completed.');
}

testConnection();