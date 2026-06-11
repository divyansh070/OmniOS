import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getMcpClients } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const studentId = (session.user as any).id;
    const clients = await getMcpClients();
    const client = clients["academics"];
    if (!client) throw new Error("Academics server not connected");

    const result = await client.callTool({
      name: "get_student_profile",
      arguments: { studentId }
    });
    
    const data = JSON.parse((result.content as any)[0].text);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
