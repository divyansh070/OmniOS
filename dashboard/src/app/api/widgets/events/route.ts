import { NextResponse } from "next/server";
import { getMcpClients } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const clients = await getMcpClients();
    const client = clients["events"];
    if (!client) throw new Error("Events server not connected");

    const result = await client.callTool({
      name: "list_events",
      arguments: {}
    });
    
    const data = JSON.parse((result.content as any)[0].text);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
