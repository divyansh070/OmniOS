import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

const server = new McpServer({ name: "mcp-memory", version: "1.0.0" });

const MEMORY_FILE = path.resolve("./memories.json");

function readMemories() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return {};
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  } catch (e) {
    return {};
  }
}

function writeMemories(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

server.tool("save_memory", "Save a fact, preference, or memory about the user", {
  studentId: z.string().describe("The ID of the student"),
  memory: z.string().describe("The fact to remember (e.g. 'Is allergic to peanuts', 'Prefers studying in the morning')")
}, async ({ studentId, memory }) => {
  const data = readMemories();
  if (!data[studentId]) data[studentId] = [];
  data[studentId].push({ timestamp: new Date().toISOString(), memory });
  writeMemories(data);
  return { content: [{ type: "text", text: "Memory saved successfully." }] };
});

server.tool("get_memories", "Get all saved memories for a student", {
  studentId: z.string().describe("The ID of the student")
}, async ({ studentId }) => {
  const data = readMemories();
  const memories = data[studentId] || [];
  return { content: [{ type: "text", text: JSON.stringify(memories, null, 2) }] };
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

const PORT = 3005;
app.listen(PORT, () => console.log(`MCP Memory Server listening on port ${PORT}`));
