import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());

const server = new McpServer({ name: "mcp-cafeteria", version: "1.0.0" });

const menu = {
  "monday": [{ item: "Grilled Chicken", vegan: false }, { item: "Veggie Burger", vegan: true }],
  "tuesday": [{ item: "Tacos", vegan: false }, { item: "Bean Burrito", vegan: true }],
  "today": [{ item: "Pasta Primavera", vegan: true }, { item: "Beef Stew", vegan: false }]
};

const menuCache = new Map();

server.tool("get_menu", "Get the cafeteria menu for a specific day", {
  day: z.string().describe("Day of the week (e.g. monday, tuesday) or 'today'")
}, async ({ day }) => {
  const cacheKey = day.toLowerCase();
  
  if (menuCache.has(cacheKey)) {
    return { content: [{ type: "text", text: menuCache.get(cacheKey) }] };
  }

  // Simulate expensive operation
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const result = menu[cacheKey] || [];
  const resultString = JSON.stringify(result, null, 2);
  
  menuCache.set(cacheKey, resultString);
  
  return {
    content: [{ type: "text", text: resultString }]
  };
});

let transport;
app.get("/sse", async (req, res) => {
  if (transport) {
    try { await server.close(); } catch(e) {}
  }
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(500).send("SSE transport not initialized");
  }
});

const PORT = 3002;
app.listen(PORT, () => console.log(`MCP Cafeteria Server listening on port ${PORT}`));
