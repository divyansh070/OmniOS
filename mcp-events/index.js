import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());

const server = new McpServer({ name: "mcp-events", version: "1.0.0" });

const events = [
  { id: "e1", title: "Tech Fest 2026", date: "2026-06-15", time: "10:00 AM", location: "Main Auditorium" },
  { id: "e2", title: "AI Workshop", date: "2026-06-16", time: "2:00 PM", location: "CS Lab 3" },
  { id: "e3", title: "Hackathon Kickoff", date: "2026-06-20", time: "5:00 PM", location: "Student Center" }
];

let eventsCache = null;

server.tool("list_events", "Get upcoming campus events", {}, async () => {
  if (eventsCache) {
    return { content: [{ type: "text", text: eventsCache }] };
  }
  
  await new Promise(resolve => setTimeout(resolve, 200));
  eventsCache = JSON.stringify(events, null, 2);
  
  return {
    content: [{ type: "text", text: eventsCache }]
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
  if (transport) await transport.handlePostMessage(req, res);
  else res.status(500).send("SSE transport not initialized");
});

const PORT = 3003;
app.listen(PORT, () => console.log(`MCP Events Server listening on port ${PORT}`));
