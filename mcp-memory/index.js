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

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

server.tool("save_memory", "Save a fact, preference, or memory about the user", {
  studentId: z.string().describe("The ID of the student"),
  memory: z.string().describe("The fact to remember (e.g. 'Is allergic to peanuts', 'Prefers studying in the morning')")
}, async ({ studentId, memory }) => {
  const { error } = await supabase
    .from('memories')
    .insert([{ student_id: studentId, memory }]);
    
  if (error) {
    return { content: [{ type: "text", text: `Failed to save memory: ${error.message}` }] };
  }
  return { content: [{ type: "text", text: "Memory saved successfully." }] };
});

server.tool("get_memories", "Get all saved memories for a student", {
  studentId: z.string().describe("The ID of the student")
}, async ({ studentId }) => {
  const { data: memories, error } = await supabase
    .from('memories')
    .select('*')
    .eq('student_id', studentId);
    
  if (error) {
    return { content: [{ type: "text", text: `Failed to retrieve memories: ${error.message}` }] };
  }
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
