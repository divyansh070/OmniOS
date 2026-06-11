import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Fetch existing chat to check ownership and current title
    const { data: existingChat, error: fetchError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    let updatedTitle = existingChat.title;
    const updatedMessages = body.messages || existingChat.messages;

    // Auto-generate title if this is the first exchange
    if (existingChat.title === "New Chat" && updatedMessages.length > 0) {
      const firstUserMsg = updatedMessages.find((m: any) => m.role === "user")?.content;
      if (firstUserMsg) {
        const words = firstUserMsg.split(" ");
        updatedTitle = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
      }
    }

    const { data: updatedChat, error: updateError } = await supabase
      .from('chats')
      .update({
        messages: updatedMessages,
        title: updatedTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      ...updatedChat,
      userId: updatedChat.user_id,
      updatedAt: updatedChat.updated_at
    });
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
    
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
