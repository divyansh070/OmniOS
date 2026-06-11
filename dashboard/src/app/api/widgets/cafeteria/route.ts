import { NextResponse } from "next/server";
import { getMcpClients } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const clients = await getMcpClients();
    const client = clients["cafeteria"];
    if (!client) throw new Error("Cafeteria server not connected");

    // Fetching Monday for demonstration, you could also use the current day
    const result = await client.callTool({
      name: "get_menu",
      arguments: { day: "Monday" }
    });
    
    const data = JSON.parse((result.content as any)[0].text);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
