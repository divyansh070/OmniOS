import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());

const server = new McpServer({ name: "mcp-library", version: "1.0.0" });

const books = [
  { id: "1", title: "Clean Code", author: "Robert C. Martin", available: true },
  { id: "2", title: "Introduction to Algorithms", author: "Thomas H. Cormen", available: false },
  { id: "3", title: "Design Patterns", author: "Erich Gamma", available: true },
  { id: "4", title: "The Pragmatic Programmer", author: "Andrew Hunt", available: true },
];

server.tool("search_books", "Search for books in the library", {
  query: z.string().optional()
}, async ({ query }) => {
  let result = books;
  if (query) {
    result = books.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()));
  }
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MCP Library Server listening on port ${PORT}`);
});
