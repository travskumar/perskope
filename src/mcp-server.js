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
            description: 'Send a WhatsApp message to a specific contact or group',
            inputSchema: {
              type: 'object',
              properties: {
                to: {
                  type: 'string',
                  description: 'Phone number (format: 917060284729) or chat ID (917060284729@c.us)',
                },
                message: {
                  type: 'string',
                  description: 'The message content to send',
                },
              },
              required: ['to', 'message'],
            },
          },
          {
            name: 'send_whatsapp_media',
            description: 'Send an image or document via WhatsApp',
            inputSchema: {
              type: 'object',
              properties: {
                to: {
                  type: 'string',
                  description: 'Phone number or chat ID',
                },
                media_url: {
                  type: 'string',
                  description: 'URL of the media file to send',
                },
                caption: {
                  type: 'string',
                  description: 'Optional caption for the media',
                },
              },
              required: ['to', 'media_url'],
            },
          },
          {
            name: 'get_whatsapp_chats',
            description: 'Get list of WhatsApp chats',
            inputSchema: {
              type: 'object',
              properties: {
                chat_type: {
                  type: 'string',
                  description: 'Filter by type: user, group, or all',
                  enum: ['user', 'group', 'all'],
                },
              },
            },
          },
          {
            name: 'get_chat_messages',
            description: 'Get recent messages from a specific chat',
            inputSchema: {
              type: 'object',
              properties: {
                chat_id: {
                  type: 'string',
                  description: 'Chat ID to get messages from',
                },
                limit: {
                  type: 'number',
                  description: 'Number of messages to retrieve (default: 50)',
                },
              },
              required: ['chat_id'],
            },
          },
          {
            name: 'get_contact_info',
            description: 'Get information about a WhatsApp contact',
            inputSchema: {
              type: 'object',
              properties: {
                phone_number: {
                  type: 'string',
                  description: 'Phone number to look up (format: 917060284729)',
                },
              },
              required: ['phone_number'],
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
                  description: 'Name for the new group',
                },
                members: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Phone numbers to add (format: ["917060284729", "919876543210"])',
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
          case 'send_whatsapp_message': {
            // Format the recipient ID properly
            let chatId = args.to;
            if (!chatId.includes('@')) {
              chatId = `${chatId}@c.us`;
            }
            
            const result = await this.periskopeClient.sendMessage(chatId, args.message);
            
            if (result.success) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `✅ Message sent successfully to ${args.to}!\n\nMessage: "${args.message}"`,
                  },
                ],
              };
            } else {
              throw new Error('Failed to send message');
            }
          }

          case 'send_whatsapp_media': {
            let chatId = args.to;
            if (!chatId.includes('@')) {
              chatId = `${chatId}@c.us`;
            }
            
            const result = await this.periskopeClient.sendMedia(
              chatId, 
              args.media_url, 
              args.caption || ''
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: `📷 Media sent successfully to ${args.to}!\n\nMedia URL: ${args.media_url}\nCaption: "${args.caption || 'No caption'}"`,
                },
              ],
            };
          }

          case 'get_whatsapp_chats': {
            const chatType = args.chat_type === 'all' ? null : args.chat_type;
            const result = await this.periskopeClient.getChats(chatType);
            
            // Extract chats from various possible response formats
            const chats = result.data?.chats || result.data || [];
            const chatList = Array.isArray(chats) ? chats : [];
            
            if (chatList.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: '📱 No chats found or unable to retrieve chats.',
                  },
                ],
              };
            }
            
            const formattedChats = chatList.map(chat => 
              `• ${chat.chat_name || 'Unknown'} (${chat.chat_id}) - ${chat.chat_type}`
            ).join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `📱 WhatsApp Chats (${chatList.length} total):\n\n${formattedChats}`,
                },
              ],
            };
          }

          case 'get_chat_messages': {
            const result = await this.periskopeClient.getChatMessages(
              args.chat_id, 
              args.limit || 50
            );
            
            const messages = result.data?.messages || [];
            const messageCount = messages.length;
            
            if (messageCount === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `💬 No messages found in chat ${args.chat_id}`,
                  },
                ],
              };
            }
            
            const formattedMessages = messages.slice(0, 10).map(msg => {
              const sender = msg.from_me ? 'You' : msg.sender_phone || 'Unknown';
              const time = new Date(msg.timestamp).toLocaleString();
              return `[${time}] ${sender}: ${msg.body || '[Media]'}`;
            }).join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `💬 Recent messages from ${args.chat_id} (showing ${Math.min(10, messageCount)} of ${messageCount}):\n\n${formattedMessages}`,
                },
              ],
            };
          }

          case 'get_contact_info': {
            const result = await this.periskopeClient.getContact(args.phone_number);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `👤 Contact Information:\n\nPhone: ${args.phone_number}\nDetails: ${JSON.stringify(result.data, null, 2)}`,
                },
              ],
            };
          }

          case 'create_whatsapp_group': {
            // Format member phone numbers
            const formattedMembers = args.members.map(member => 
              member.includes('@') ? member : `${member}@c.us`
            );
            
            const result = await this.periskopeClient.createGroup(
              args.name,
              formattedMembers
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: `👥 Group "${args.name}" created successfully!\n\nMembers added: ${args.members.join(', ')}`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${error.message}\n\nPlease check the format and try again.`,
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

// Start the server
const server = new PeriskopeMCPServer();
server.run().catch(console.error);