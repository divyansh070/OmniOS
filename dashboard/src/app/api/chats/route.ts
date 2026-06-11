import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    const { data: userChats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Map database fields to the frontend expected format if needed
    const formattedChats = userChats.map(chat => ({
      ...chat,
      userId: chat.user_id,
      updatedAt: chat.updated_at
    }));

    return NextResponse.json(formattedChats);
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
    
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert([
        { 
          user_id: userId,
          title: "New Chat",
          messages: []
        }
      ])
      .select()
      .single();

    if (error) throw error;

    const formattedChat = {
      ...newChat,
      userId: newChat.user_id,
      updatedAt: newChat.updated_at
    };

    return NextResponse.json(formattedChat);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

