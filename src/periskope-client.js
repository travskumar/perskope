// src/periskope-client.js
import { PeriskopeApi } from '@periskope/periskope-client';
import dotenv from 'dotenv';

dotenv.config();

class PeriskopeClient {
  constructor() {
    // Initialize the official Periskope client
    this.client = new PeriskopeApi({
      authToken: process.env.PERISKOPE_API_KEY,
      phone: process.env.PERISKOPE_PHONE_NUMBER,
    });
  }

  async sendMessage(chatId, message) {
    try {
      // Based on the API examples, use message.send
      const response = await this.client.message.send({
        chat_id: chatId,
        message: message
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendMessageDirect(chatId, message) {
    // Fallback method for direct sending
    return this.sendMessage(chatId, message);
  }

  async getChats(chatType = null) {
    try {
      // Based on API examples, use chat.getChats()
      const params = {};
      if (chatType) {
        params.chat_type = chatType;
      }
      const response = await this.client.chat.getChats(params);
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to get chats:', error);
      throw error;
    }
  }

  async getChatById(chatId) {
    try {
      // Based on API examples
      const response = await this.client.chat.getChatById({
        chat_id: chatId
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to get chat by ID:', error);
      throw error;
    }
  }

  async getChatMessages(chatId) {
    try {
      // Based on API examples
      const response = await this.client.chat.getChatMessages({
        chat_id: chatId
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to get chat messages:', error);
      throw error;
    }
  }

  async getAllMessages() {
    try {
      // Based on API examples
      const response = await this.client.chat.getMessages();
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to get all messages:', error);
      throw error;
    }
  }

  async createGroup(name, members) {
    try {
      // This might need to be adjusted based on actual API
      const response = await this.client.group.create({
        name: name,
        members: members
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to create group:', error);
      // If group.create doesn't exist, try alternative approach
      throw error;
    }
  }

  // Alternative method using direct API calls if client library doesn't work
  async makeDirectAPICall(endpoint, method = 'GET', data = null) {
    const baseUrl = 'https://api.periskope.app/v1';
    const url = `${baseUrl}${endpoint}`;
    
    const headers = {
      'Authorization': `Bearer ${process.env.PERISKOPE_API_KEY}`,
      'Content-Type': 'application/json',
      'x-phone': process.env.PERISKOPE_PHONE_NUMBER
    };

    const options = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Direct API call failed for ${endpoint}:`, error);
      throw error;
    }
  }
}

export default PeriskopeClient;