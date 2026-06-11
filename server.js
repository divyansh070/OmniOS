const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

const services = [
  { name: "library", dir: "mcp-library", port: 3001 },
  { name: "cafeteria", dir: "mcp-cafeteria", port: 3002 },
  { name: "events", dir: "mcp-events", port: 3003 },
  { name: "academics", dir: "mcp-academics", port: 3004 },
  { name: "memory", dir: "mcp-memory", port: 3005 }
];

// Start all MCP sub-servers
services.forEach(service => {
  console.log(`Starting ${service.name} on port ${service.port}...`);
  const child = spawn("node", ["index.js"], {
    cwd: path.join(__dirname, service.dir),
    env: { ...process.env, PORT: service.port }
  });

  child.stdout.on("data", data => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  child.stderr.on("data", data => {
    console.error(`[${service.name} ERROR] ${data.toString().trim()}`);
  });

  child.on("close", code => {
    console.log(`[${service.name}] exited with code ${code}`);
  });
});

// Proxy routes for Server-Sent Events (SSE)
services.forEach(service => {
  app.use(
    `/${service.name}`,
    createProxyMiddleware({
      target: `http://localhost:${service.port}`,
      changeOrigin: true,
      ws: true,
      logger: console
    })
  );
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`OmniOS Proxy Gateway running on port ${PORT}`);
});
