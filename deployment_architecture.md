# Step-by-Step Production Deployment Guide (OmniOS)

This guide provides a step-by-step walkthrough to transition **OmniOS** from your local development setup to a production-grade, highly scalable stack using **Supabase** (Database & Auth), **Render** (Node.js MCP Services), and **Vercel** (Next.js Frontend).

---

## 🛠️ Step 1: Database & Schema Setup (Supabase)

Supabase replaces the local mock storage (`chats.json` and `memories.json`) with an enterprise-ready PostgreSQL database.

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project named **OmniOS**.
3. Save your **DB Password**, **Project URL**, and **Anon Key** safely.

### 2. Set Up the SQL Tables
Navigate to the **SQL Editor** in the Supabase Dashboard and execute the following script to create your tables and enable row-level security (RLS):

```sql
-- Create Chats Table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Memories Table
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  memory TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Index user_id and student_id for fast queries
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_memories_student_id ON public.memories(student_id);

-- (Optional) Enable Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create Policies for simple user isolation
CREATE POLICY "Users can manage their own chats" ON public.chats
  FOR ALL USING (true); -- Replace 'true' with auth.uid() check if using Supabase Auth

CREATE POLICY "Users can manage their own memories" ON public.memories
  FOR ALL USING (true);
```

---

## 🌐 Step 2: Deploying the 5 MCP Servers (Render)

Render will host the Node.js Server-Sent Events (SSE) servers. You can deploy all 5 separately, or merge them into a single port app.

### Option A: Merge into a Single Express App (Highly Recommended for Hobby Projects)
To save on Render resources (since Render's free tier has instance limits and spin-up delays), consolidate the servers into a single Node service that mounts all 5 endpoints:

```javascript
// Example of a merged server launcher (e.g., server.js)
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

// Mount the services
const libraryApp = require("./mcp-library");
const cafeteriaApp = require("./mcp-cafeteria");
const eventsApp = require("./mcp-events");
const academicsApp = require("./mcp-academics");
const memoryApp = require("./mcp-memory");

app.use("/library", libraryApp);
app.use("/cafeteria", cafeteriaApp);
app.use("/events", eventsApp);
app.use("/academics", academicsApp);
app.use("/memory", memoryApp);

app.listen(process.env.PORT || 10000);
```

### Option B: Deploy Individually
1. Commit the MCP directories to GitHub (either in a single monorepo or 5 separate repositories).
2. Go to [render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. For each MCP service, configure:
   * **Name**: `mcp-library`, `mcp-cafeteria`, etc.
   * **Root Directory**: `mcp-library` (or correct folder path).
   * **Build Command**: `npm install`
   * **Start Command**: `node index.js`
   * **Environment Variables**: Add `PORT` (e.g., `3000`).
5. Render will deploy each service and give you a public URL (e.g., `https://mcp-library-xxxx.onrender.com`).

---

## ⚡ Step 3: Next.js Frontend Config & Deployment (Vercel)

Vercel hosts the Next.js frontend and its Serverless API functions.

### 1. Update Frontend Database Connection (Local to Supabase)
Install the Supabase client package in your frontend:
```bash
npm install @supabase/supabase-js
```

Create a Supabase client configuration inside `dashboard/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Update your chat storage/retrieve API routes (e.g., `dashboard/src/app/api/chats/route.ts` and `[id]/route.ts`) to query Supabase instead of local `.json` file reads/writes:
```typescript
// Example: Reading chats from Supabase in route.ts
const { data, error } = await supabase
  .from('chats')
  .select('*')
  .eq('user_id', userId)
  .order('updated_at', { ascending: false });
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Select your `OmniOS` repository and configure the **Root Directory** as `dashboard` (since the workspace is a monorepo).
3. **Add Environment Variables**:
   * `SUPABASE_URL`: (From your Supabase dashboard)
   * `SUPABASE_ANON_KEY`: (From your Supabase dashboard)
   * `GEMINI_API_KEY`: (Your Gemini API Key)
   * `NEXTAUTH_SECRET`: (Generate a secure random string)
   * `NEXTAUTH_URL`: (Your final Vercel app URL, e.g., `https://your-app.vercel.app`)
   * `MCP_LIBRARY_URL`: `https://mcp-library.onrender.com/sse`
   * `MCP_CAFETERIA_URL`: `https://mcp-cafeteria.onrender.com/sse`
   * `MCP_EVENTS_URL`: `https://mcp-events.onrender.com/sse`
   * `MCP_ACADEMICS_URL`: `https://mcp-academics.onrender.com/sse`
   * `MCP_MEMORY_URL`: `https://mcp-memory.onrender.com/sse`
4. Click **Deploy**.

---

## 🔒 Step 4: Final Security & CORS Handshake

To prevent communication blocks between your frontend (Vercel) and backend (Render):
1. **CORS on Render:** Ensure all your Render MCP Node.js services are configured with `cors` to accept incoming EventSource requests from your custom Vercel domain.
2. **NextAuth Production Domain:** In your Supabase dashboard authentication section, add your Vercel URL to the **Redirect URLs** whitelist to ensure authentication logins redirect properly.
