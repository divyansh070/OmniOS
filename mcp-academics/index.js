import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

const app = express();
app.use(cors());

const server = new McpServer({ name: "mcp-academics", version: "1.0.0" });

const academicInfo = {
  "calendar": "Spring Semester ends June 30th. Fall Semester starts Sept 1st.",
  "deadlines": "Course withdrawal deadline is June 15th."
};

const studentData = {
  "student123": {
    gpa: 3.8,
    advisor: "Dr. Alan Turing",
    advisorEmail: "alan.turing@mars.edu",
    schedule: [
      { course: "CS101", name: "Intro to Computer Science", time: "Mon/Wed 10:00 AM", location: "Turing Hall 102" },
      { course: "MATH201", name: "Linear Algebra", time: "Tue/Thu 1:00 PM", location: "Euler Bldg 204" }
    ],
    grades: {
      "CS101": "A",
      "MATH201": "B+"
    }
  },
  "student456": {
    gpa: 3.5,
    advisor: "Dr. Marie Curie",
    advisorEmail: "marie.curie@mars.edu",
    schedule: [
      { course: "EE201", name: "Circuits I", time: "Mon/Wed 11:00 AM", location: "Tesla Lab 1" },
      { course: "PHYS102", name: "Physics II", time: "Tue/Thu 9:00 AM", location: "Newton Hall 4" }
    ],
    grades: {
      "EE201": "A-",
      "PHYS102": "B"
    }
  }
};

server.tool("get_academic_info", "Get general academic calendar and deadlines", {
  type: z.enum(["calendar", "deadlines"]).describe("Type of academic info to retrieve")
}, async ({ type }) => {
  const result = academicInfo[type] || "Not found";
  return {
    content: [{ type: "text", text: result }]
  };
});

server.tool("get_student_profile", "Get personalized academic profile for a student including GPA, advisor, schedule, and grades. Call this if you have the student's ID from the CURRENT USER CONTEXT.", {
  studentId: z.string().describe("The student ID (e.g., student123)")
}, async ({ studentId }) => {
  const data = studentData[studentId];
  if (!data) {
    return {
      content: [{ type: "text", text: `No academic data found for student ID: ${studentId}` }]
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
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

const PORT = 3004;
app.listen(PORT, () => console.log(`MCP Academics Server listening on port ${PORT}`));
