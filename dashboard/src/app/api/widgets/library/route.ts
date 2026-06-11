import { NextResponse } from "next/server";
import { getMcpClients } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const clients = await getMcpClients();
    const client = clients["library"];
    if (!client) throw new Error("Library server not connected");

    // Fetching some books for the "Interdisciplinary Picks" widget
    const result = await client.callTool({
      name: "search_books",
      arguments: { query: "science" } // Some generic search query to get popular books
    });
    
    const data = JSON.parse((result.content as any)[0].text);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
