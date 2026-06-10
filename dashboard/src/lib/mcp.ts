import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { EventSource } from "eventsource";

// Polyfill EventSource for Node.js if needed
if (typeof global !== 'undefined' && !global.EventSource) {
  (global as any).EventSource = EventSource;
}

const servers = [
  { name: "library", url: "http://localhost:3001/sse" },
  { name: "cafeteria", url: "http://localhost:3002/sse" },
  { name: "events", url: "http://localhost:3003/sse" },
  { name: "academics", url: "http://localhost:3004/sse" },
  { name: "memory", url: "http://localhost:3005/sse" },
];

const globalForMcp = globalThis as unknown as {
  mcpClients: Record<string, Client>;
  isConnecting: boolean;
};

if (!globalForMcp.mcpClients) {
  globalForMcp.mcpClients = {};
}
if (!globalForMcp.isConnecting) {
  globalForMcp.isConnecting = false;
}

export async function getMcpClients() {
  if (Object.keys(globalForMcp.mcpClients).length === servers.length) return globalForMcp.mcpClients;
  if (globalForMcp.isConnecting) {
     // Wait for existing connection attempt to finish
     await new Promise(resolve => setTimeout(resolve, 500));
     return globalForMcp.mcpClients;
  }
  globalForMcp.isConnecting = true;

  try {
    for (const server of servers) {
      if (globalForMcp.mcpClients[server.name]) continue;

      console.log(`Connecting to MCP server: ${server.name} at ${server.url}`);
      const transport = new SSEClientTransport(new URL(server.url));
      const client = new Client({
        name: "dashboard-client",
        version: "1.0.0",
      }, {
        capabilities: {}
      });
      try {
        await client.connect(transport);
        globalForMcp.mcpClients[server.name] = client;
      } catch (e) {
        console.error(`Failed to connect to MCP server: ${server.name}`, e);
      }
    }
  } finally {
    globalForMcp.isConnecting = false;
  }

  return globalForMcp.mcpClients;
}
