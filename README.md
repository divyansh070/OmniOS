<div align="center">
  <h1>🎓 OmniOS</h1>
  <p><strong>The Unified Campus Intelligence Platform</strong></p>

  <p>
    <a href="https://omni-os-mcp-academics-k46o.vercel.app"><strong>View Live Demo</strong></a> · 
    <a href="#-core-features">Explore Features</a> · 
    <a href="#-quick-start">Installation</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Gemini-2.5_Flash-blue?style=for-the-badge&logo=google" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/MCP-Architecture-orange?style=for-the-badge" alt="Model Context Protocol" />
    <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  </p>
</div>

<hr />

## 🌟 Vision

**OmniOS** revolutionizes the university experience by consolidating fragmented digital infrastructure into a single, intelligent interface. Instead of juggling multiple portals to check library dues, cafeteria menus, academic transcripts, and campus events, students interact with a powerful, context-aware AI assistant. 

Powered by **Google Gemini** and the **Model Context Protocol (MCP)**, the assistant securely accesses independent microservices in real-time, providing personalized, accurate, and instant answers to any campus-related query.

---

## ✨ Core Features

### 🤖 Intelligent Campus Assistant
A centralized AI interface that understands natural language. Ask complex, multi-domain questions like: *"What's for lunch today, and do I have time to eat before my afternoon Computer Science lecture?"* The assistant routes the request to the appropriate microservices, synthesizes the data, and provides a cohesive answer.

### 🧠 Persistent, Personalized Memory
Using the dedicated Memory MCP Server, the AI proactively learns and remembers student preferences. It securely stores facts such as dietary restrictions (e.g., *Vegan*), favorite study environments, and major declarations, automatically factoring these into future recommendations without the user needing to repeat themselves.

### 🏛️ Decentralized Microservice Architecture
The platform is built on five entirely independent Server-Sent Event (SSE) microservices. This ensures flawless scalability and robust separation of concerns:
- 📚 **Library System**: Query catalog availability, track borrowed books, and reserve silent study rooms.
- 🍔 **Cafeteria System**: Access live daily menus, dietary tags, and operational hours across all campus dining halls.
- 🎉 **Events System**: Browse upcoming campus activities, club meetings, and RSVP statuses.
- 📝 **Academics System**: Securely access real-time class schedules, credit hours, and GPA transcripts.

### 🔒 Secure & Synchronized
- **Database Backed**: All chat histories and AI memories are safely stored and synced in real-time using **Supabase (PostgreSQL)**.
- **Authentication**: Modern, secure credential-based login powered by **NextAuth.js**.

---

## 🛠 Tech Stack

**Frontend Client**
- **Framework**: Next.js (App Router), React
- **Styling**: Tailwind CSS, Framer Motion (for fluid micro-animations)
- **Auth**: NextAuth.js

**Backend Microservices**
- **Framework**: Node.js, Express
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`)
- **Protocol**: `@modelcontextprotocol/sdk` (SSE Transport)

**Infrastructure & DevOps**
- **Monorepo Management**: NPM Workspaces
- **Database**: Supabase
- **Hosting**: Vercel (Frontend Client) & Render (Consolidated Backend Proxy)

---

## 📂 Repository Structure

The project utilizes an NPM Workspaces monorepo architecture to streamline dependency management across the microservices.

```text
/
├── dashboard/           # The Next.js Frontend Client
├── mcp-academics/       # MCP Server: Grades & Schedules
├── mcp-cafeteria/       # MCP Server: Menus & Dining
├── mcp-events/          # MCP Server: Campus Life
├── mcp-library/         # MCP Server: Books & Rooms
├── mcp-memory/          # MCP Server: Persistent AI memory
├── server.js            # Reverse proxy consolidating all MCPs
└── package.json         # Workspace orchestration
```

---

## 🚀 Quick Start

Follow these instructions to run the entire distributed system locally on your machine.

### 1. Prerequisites
- **Node.js** (v20 or higher)
- A **Google Gemini API Key** (Get one [here](https://aistudio.google.com/))
- A **Supabase** Account

### 2. Clone & Install
```bash
git clone https://github.com/divyansh070/OmniOS.git
cd OmniOS

# Install dependencies for the root and all workspaces simultaneously
npm install
```

### 3. Database Initialization (Supabase)
Navigate to your Supabase project's SQL Editor and run the following schema definitions:
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

-- Optimize queries
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_memories_student_id ON public.memories(student_id);
```

### 4. Environment Configuration
Create a `.env.local` file inside the `dashboard/` folder. Add the following variables:
```env
# Database Connections
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Security & Authentication
NEXTAUTH_SECRET=generate_a_random_32_character_string
NEXTAUTH_URL=http://localhost:3000

# Artificial Intelligence
GEMINI_API_KEY=your_gemini_api_key

# Local Microservice Endpoints
MCP_LIBRARY_URL=http://localhost:3001/sse
MCP_CAFETERIA_URL=http://localhost:3002/sse
MCP_EVENTS_URL=http://localhost:3003/sse
MCP_ACADEMICS_URL=http://localhost:3004/sse
MCP_MEMORY_URL=http://localhost:3005/sse
```

### 5. Boot Up the Platform
You will need two terminal windows to run the frontend and backend concurrently.

**Terminal 1 (Backend Services):**
```bash
# Starts the reverse proxy and all 5 MCP servers automatically
npm start
```

**Terminal 2 (Frontend Client):**
```bash
cd dashboard
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with OmniOS.

---

<div align="center">
  <p>Built with ❤️ to redefine the modern university experience.</p>
</div>
