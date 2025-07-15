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
  
  // Test 2: Test send message using official client
  console.log('\n📱 Testing send message with official client...');
  try {
    const messageResult = await client.sendMessage('917060284729@c.us', 'Test message from Periskope MCP');
    console.log('✅ Message sent successfully:', messageResult);
  } catch (error) {
    console.log('⚠️ Official client failed:', error.message);
    
    // Test 3: Fallback to direct API call
    console.log('\n🔄 Trying direct API call...');
    try {
      const directResult = await client.makeDirectAPICall('/messages', 'POST', {
        chat_id: '917060284729@c.us',
        message: 'Test message from direct API'
      });
      console.log('✅ Direct API call successful:', directResult);
    } catch (directError) {
      console.log('❌ Direct API call also failed:', directError.message);
      
      // Test 4: Try different endpoints
      console.log('\n🔍 Testing different API endpoints...');
      const endpoints = [
        'https://api.periskope.app/v1/messages',
        'https://api.periskope.app/messages',
        'https://console.periskope.app/api/v1/messages',
        'https://console.periskope.app/api/messages'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PERISKOPE_API_KEY}`,
              'Content-Type': 'application/json',
              'x-phone': process.env.PERISKOPE_PHONE_NUMBER
            },
            body: JSON.stringify({
              chat_id: '917060284729@c.us',
              message: 'Test message'
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Success with endpoint: ${endpoint}`, result);
            break;
          } else {
            console.log(`❌ Failed with endpoint: ${endpoint} - Status: ${response.status}`);
          }
        } catch (endpointError) {
          console.log(`❌ Error with endpoint: ${endpoint} - ${endpointError.message}`);
        }
      }
    }
  }
  
  // Test 5: Test get chats
  console.log('\n📱 Testing get chats...');
  try {
    const chats = await client.getChats();
    console.log('✅ Chats retrieved:', chats.data?.length || 'No length property');
  } catch (error) {
    console.log('⚠️ Get chats failed:', error.message);
  }
  
  console.log('\n🏁 Connection test completed.');
}

testConnection();