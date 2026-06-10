import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
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

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const allChats = readChats();
    const userChats = allChats.filter((c: any) => c.userId === userId).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(userChats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const allChats = readChats();
    
    const newChat = {
      id: Date.now().toString(),
      userId,
      title: "New Chat",
      messages: [],
      updatedAt: new Date().toISOString()
    };
    
    allChats.push(newChat);
    writeChats(allChats);

    return NextResponse.json(newChat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
