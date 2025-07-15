#!/usr/bin/env node
// src/cli.js

import { program } from 'commander';
import PeriskopeClient from './periskope-client.js';
import readline from 'readline';

const client = new PeriskopeClient();

program
  .name('periskope')
  .description('CLI tool for sending WhatsApp messages via Periskope')
  .version('1.0.0');

program
  .command('send <phone> <message>')
  .description('Send a WhatsApp message')
  .action(async (phone, message) => {
    try {
      const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
      console.log(`📤 Sending message to ${chatId}...`);
      const result = await client.sendMessage(chatId, message);
      console.log('✅ Message sent successfully!');
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  });

program
  .command('chats')
  .description('List all WhatsApp chats')
  .option('-t, --type <type>', 'Filter by type (user/group)')
  .action(async (options) => {
    try {
      console.log('📱 Getting chats...');
      const result = await client.getChats(options.type);
      const chats = result.data?.chats || result.data || [];
      
      if (Array.isArray(chats)) {
        console.log(`\nFound ${chats.length} chats:\n`);
        chats.forEach(chat => {
          console.log(`• ${chat.chat_name} (${chat.chat_id}) - ${chat.chat_type}`);
        });
      } else {
        console.log('No chats found or unexpected response format');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  });

program
  .command('messages <chatId>')
  .description('Get messages from a chat')
  .option('-l, --limit <number>', 'Number of messages to retrieve', '20')
  .action(async (chatId, options) => {
    try {
      console.log(`💬 Getting messages from ${chatId}...`);
      const result = await client.getChatMessages(chatId, parseInt(options.limit));
      const messages = result.data?.messages || [];
      
      console.log(`\nFound ${messages.length} messages:\n`);
      messages.forEach(msg => {
        const sender = msg.from_me ? 'You' : msg.sender_phone || 'Unknown';
        const time = new Date(msg.timestamp).toLocaleString();
        console.log(`[${time}] ${sender}: ${msg.body || '[Media]'}`);
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  });

program
  .command('interactive')
  .description('Interactive mode for sending messages')
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🎯 Interactive WhatsApp Messenger');
    console.log('Type "exit" to quit\n');

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };

    while (true) {
      const phone = await askQuestion('Enter phone number (or "exit" to quit): ');
      if (phone.toLowerCase() === 'exit') break;

      const message = await askQuestion('Enter message: ');
      if (message.toLowerCase() === 'exit') break;

      try {
        const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
        console.log(`\n📤 Sending to ${chatId}...`);
        await client.sendMessage(chatId, message);
        console.log('✅ Message sent!\n');
      } catch (error) {
        console.error('❌ Error:', error.message, '\n');
      }
    }

    rl.close();
    console.log('\n👋 Goodbye!');
  });

program.parse();