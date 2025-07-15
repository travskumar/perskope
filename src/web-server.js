// src/web-server.js
import express from 'express';
import cors from 'cors';
import PeriskopeClient from './periskope-client.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const periskopeClient = new PeriskopeClient();

// Middleware
app.use(cors());
app.use(express.json());

// Simple web interface
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Periskope WhatsApp API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .endpoint { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>Periskope WhatsApp API Server</h1>
        <p>Server is running! Use these endpoints:</p>
        
        <div class="endpoint">
          <h3>Send Message</h3>
          <code>POST /api/send-message</code>
          <pre>
Body: {
  "chatId": "917060284729@c.us",
  "message": "Your message here"
}</pre>
        </div>
        
        <div class="endpoint">
          <h3>Get Chats</h3>
          <code>GET /api/chats</code>
        </div>
        
        <div class="endpoint">
          <h3>Get Messages</h3>
          <code>GET /api/messages/:chatId</code>
        </div>
        
        <h2>Quick Test</h2>
        <button onclick="testSend()">Send Test Message</button>
        <div id="result"></div>
        
        <script>
          async function testSend() {
            const result = await fetch('/api/send-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId: '917060284729@c.us',
                message: 'Test message from web interface at ' + new Date().toLocaleString()
              })
            });
            const data = await result.json();
            document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          }
        </script>
      </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/send-message', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId and message are required' });
    }
    
    const result = await periskopeClient.sendMessage(chatId, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats', async (req, res) => {
  try {
    const { type } = req.query;
    const result = await periskopeClient.getChats(type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50 } = req.query;
    const result = await periskopeClient.getChatMessages(chatId, parseInt(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/send-media', async (req, res) => {
  try {
    const { chatId, mediaUrl, caption } = req.body;
    
    if (!chatId || !mediaUrl) {
      return res.status(400).json({ error: 'chatId and mediaUrl are required' });
    }
    
    const result = await periskopeClient.sendMedia(chatId, mediaUrl, caption);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-group', async (req, res) => {
  try {
    const { name, members } = req.body;
    
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'name and members array are required' });
    }
    
    const result = await periskopeClient.createGroup(name, members);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Periskope API server running at http://localhost:${port}`);
  console.log(`📱 Open http://localhost:${port} in your browser to test`);
});