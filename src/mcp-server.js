#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import PeriskopeClient from './periskope-client.js';

class PeriskopeMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'periskope-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.periskopeClient = new PeriskopeClient();
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_whatsapp_message',
            description: 'Send a WhatsApp message to a specific chat or person',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'WhatsApp chat ID (e.g., 917060284729@c.us for individual, or 120363373936603867@g.us for group)',
                },
                message: {
                  type: 'string',
                  description: 'The message content to send',
                },
              },
              required: ['chat_id', 'message'],
            },
          },
          {
            name: 'get_whatsapp_chats',
            description: 'Get all WhatsApp chats and conversations',
            inputSchema: {
              type: 'object',
              properties: {
                chat_type: {
                  type: 'string',
                  description: 'Filter by chat type: "user" for individual chats, "group" for group chats, or leave empty for all',
                  enum: ['user', 'group'],
                },
              },
            },
          },
          {
            name: 'get_chat_details',
            description: 'Get detailed information about a specific chat',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'WhatsApp chat ID to get details for',
                },
              },
              required: ['chat_id'],
            },
          },
          {
            name: 'get_chat_messages',
            description: 'Get messages from a specific chat',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'WhatsApp chat ID to get messages from',
                },
              },
              required: ['chat_id'],
            },
          },
          {
            name: 'get_all_messages',
            description: 'Get all recent messages across all chats',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'create_whatsapp_group',
            description: 'Create a new WhatsApp group',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the group to create',
                },
                members: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of phone numbers to add to the group (format: 919537851844@c.us)',
                },
              },
              required: ['name', 'members'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_whatsapp_message':
            const messageResult = await this.periskopeClient.sendMessage(
              args.chat_id,
              args.message
            );
            return {
              content: [
                {
                  type: 'text',
                  text: `✅ Message sent successfully!\n\nChat ID: ${args.chat_id}\nMessage: "${args.message}"\n\nResponse: ${JSON.stringify(messageResult, null, 2)}`,
                },
              ],
            };

          case 'get_whatsapp_chats':
            const chatsResult = await this.periskopeClient.getChats(args.chat_type);
            const chats = chatsResult.data?.chats || [];
            const chatList = chats.map(chat => 
              `- ${chat.chat_name} (${chat.chat_id}) - Type: ${chat.chat_type}`
            ).join('\n');
            return {
              content: [
                {
                  type: 'text',
                  text: `📱 WhatsApp Chats (${chats.length} total):\n\n${chatList}\n\nFull data:\n${JSON.stringify(chatsResult, null, 2)}`,
                },
              ],
            };

          case 'get_chat_details':
            const chatDetails = await this.periskopeClient.getChatById(args.chat_id);
            return {
              content: [
                {
                  type: 'text',
                  text: `📋 Chat Details for ${args.chat_id}:\n\n${JSON.stringify(chatDetails, null, 2)}`,
                },
              ],
            };

          case 'get_chat_messages':
            const messages = await this.periskopeClient.getChatMessages(args.chat_id);
            const messageCount = messages.data?.messages?.length || messages.data?.count || 0;
            return {
              content: [
                {
                  type: 'text',
                  text: `💬 Messages from ${args.chat_id} (${messageCount} messages):\n\n${JSON.stringify(messages, null, 2)}`,
                },
              ],
            };

          case 'get_all_messages':
            const allMessages = await this.periskopeClient.getAllMessages();
            const totalMessages = allMessages.data?.messages?.length || allMessages.data?.count || 0;
            return {
              content: [
                {
                  type: 'text',
                  text: `📨 All Recent Messages (${totalMessages} total):\n\n${JSON.stringify(allMessages, null, 2)}`,
                },
              ],
            };

          case 'create_whatsapp_group':
            const groupResult = await this.periskopeClient.createGroup(
              args.name,
              args.members
            );
            return {
              content: [
                {
                  type: 'text',
                  text: `👥 Group "${args.name}" created successfully!\n\nMembers: ${args.members.join(', ')}\n\nResponse: ${JSON.stringify(groupResult, null, 2)}`,
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error executing ${name}: ${error.message}\n\nFull error: ${JSON.stringify(error, null, 2)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Periskope MCP server running on stdio');
  }
}

const server = new PeriskopeMCPServer();
server.run().catch(console.error);