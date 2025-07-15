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
                  description: 'WhatsApp chat ID (e.g., 917060284729@c.us for individual, or group ID)',
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
                  description: 'Array of phone numbers to add to the group',
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
            const messageResult = await this.periskopeClient.sendMessageDirect(
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
            const chatsResult = await this.periskopeClient.getChats();
            return {
              content: [
                {
                  type: 'text',
                  text: `📱 WhatsApp Chats:\n\n${JSON.stringify(chatsResult, null, 2)}`,
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
              text: `❌ Error executing ${name}: ${error.message}`,
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