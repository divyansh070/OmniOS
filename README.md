# OmniOS - Unified Campus Intelligence Platform 🎓🤖

OmniOS is a next-generation AI-powered unified dashboard for university students. Instead of juggling five different portals for library books, cafeteria menus, campus events, academic records, and personalized memory, OmniOS connects them all in real-time through an advanced decentralized AI protocol known as the Model Context Protocol (MCP).

**Live Demo:** [https://omni-os-mcp-academics-k46o.vercel.app/dashboard](https://omni-os-mcp-academics-k46o.vercel.app/dashboard)

## ✨ Features
- **AI Campus Assistant**: A powerful, Gemini-driven AI assistant that natively understands all campus systems.
- **5 Independent Microservices (MCP)**:
  - 📚 **Library Server**: Query available books and reserve study rooms.
  - 🍔 **Cafeteria Server**: Check daily menus and nutritional information.
  - 🎉 **Events Server**: Stay updated on campus events and RSVPs.
  - 📝 **Academics Server**: Access grades, schedules, and courses.
  - 🧠 **Memory Server**: The AI remembers student preferences (e.g., allergies, favorite study spots) persistently.
- **Persistent Chat History**: All conversations are saved securely in the cloud.
- **Responsive Modern UI**: Built with Next.js, Framer Motion, and Tailwind CSS.
- **Secure Authentication**: Built-in credential-based authentication using NextAuth.

## 🛠 Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion, NextAuth
- **Backend**: Node.js, Express, Model Context Protocol (MCP) SDK
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`)
- **Architecture**: NPM Workspaces Monorepo
- **Hosting**: Vercel (Frontend) & Render (Backend Microservices)

## 📂 Repository Structure
This repository is organized as an NPM Monorepo using NPM Workspaces:
```text
/
├── dashboard/           # Next.js Frontend (Deployed on Vercel)
├── mcp-academics/       # Academics Microservice (MCP)
├── mcp-cafeteria/       # Cafeteria Microservice (MCP)
├── mcp-events/          # Events Microservice (MCP)
├── mcp-library/         # Library Microservice (MCP)
├── mcp-memory/          # Persistent User Memory (MCP via Supabase)
├── server.js            # Consolidated Reverse Proxy (Deployed on Render)
└── package.json         # Monorepo Workspace configuration
```

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v20+)
- A [Supabase](https://supabase.com/) Account (for PostgreSQL database)
- A [Google Gemini](https://aistudio.google.com/) API Key

### 2. Local Installation
Clone the repository and install all dependencies (this automatically handles all microservices via NPM workspaces):
```bash
git clone https://github.com/divyansh070/OmniOS.git
cd OmniOS
npm install
```

### 3. Database Setup (Supabase)
Run the following SQL in your Supabase SQL Editor:
```sql
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  memory TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

### 4. Environment Variables
Create a `.env.local` file inside the `dashboard/` directory:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth
NEXTAUTH_SECRET=generate_a_random_32_character_string
NEXTAUTH_URL=http://localhost:3000

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# Local MCP Servers
MCP_LIBRARY_URL=http://localhost:3001/sse
MCP_CAFETERIA_URL=http://localhost:3002/sse
MCP_EVENTS_URL=http://localhost:3003/sse
MCP_ACADEMICS_URL=http://localhost:3004/sse
MCP_MEMORY_URL=http://localhost:3005/sse
```

### 5. Running Locally
Start the backend MCP servers and the Next.js frontend simultaneously:

**Terminal 1 (Backend proxy):**
```bash
npm start
```
*Starts the reverse proxy on port 8080 and boots all 5 microservices.*

**Terminal 2 (Frontend):**
```bash
cd dashboard
npm run dev
```
*Starts the dashboard on http://localhost:3000*

## 🌐 Deployment
- **Backend**: The root directory is deployed to a single Render Web Service which runs `npm start` to proxy requests to all microservices to bypass free-tier limitations.
- **Frontend**: The `dashboard/` directory is deployed to Vercel with the associated cloud environment variables.
