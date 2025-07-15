// src/periskope-client.js
import { PeriskopeApi } from '@periskope/periskope-client';
import dotenv from 'dotenv';

dotenv.config();

class PeriskopeClient {
  constructor() {
    // Initialize the official Periskope client
    this.client = new PeriskopeApi({
      authToken: process.env.PERISKOPE_API_KEY,
      phone: process.env.PERISKOPE_PHONE_NUMBER, // Use phone number, not phone ID
    });
  }

  async sendMessage(chatId, message) {
    try {
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

  async getChats() {
    try {
      // The API might use a different method name
      const response = await this.client.chat.list();
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to get chats:', error);
      throw error;
    }
  }

  async createGroup(name, members) {
    try {
      const response = await this.client.group.create({
        name: name,
        members: members
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  async getTickets() {
    try {
      // Try different possible method names
      const response = await this.client.ticket.list();
      return { success: true, data: response };
    } catch (error) {
      console.error('Failed to get tickets:', error);
      throw error;
    }
  }

  // Alternative method using direct API calls if client library doesn't work
  async makeDirectAPICall(endpoint, method = 'GET', data = null) {
    const baseUrl = 'https://api.periskope.app/v1'; // Common API pattern
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