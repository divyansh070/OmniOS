import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

const CHATS_FILE = path.resolve("./chats.json");

function readChats() {
  try {
    if (!fs.existsSync(CHATS_FILE)) return [];
    return JSON.parse(fs.readFileSync(CHATS_FILE, "utf-8"));
  } catch (e) {
    return [];
  }
}

function writeChats(data: any) {
  fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const allChats = readChats();
    
    const chatIndex = allChats.findIndex((c: any) => c.id === resolvedParams.id && c.userId === userId);
    
    if (chatIndex === -1) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    
    const chat = allChats[chatIndex];
    chat.messages = body.messages || chat.messages;
    
    // Auto-generate title if this is the first exchange
    if (chat.title === "New Chat" && chat.messages.length > 0) {
      const firstUserMsg = chat.messages.find((m: any) => m.role === "user")?.content;
      if (firstUserMsg) {
        // Very basic title extraction (first 3 words)
        const words = firstUserMsg.split(" ");
        chat.title = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
      }
    }
    
    chat.updatedAt = new Date().toISOString();
    writeChats(allChats);

    return NextResponse.json(chat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    let allChats = readChats();
    
    allChats = allChats.filter((c: any) => !(c.id === resolvedParams.id && c.userId === userId));
    writeChats(allChats);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
