import { getMcpClients } from "@/lib/mcp";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

function mcpToolToGeminiFunction(mcpTool: any, serverName: string) {
  const safeServerName = serverName.replace(/[^a-zA-Z0-9_]/g, '');
  const functionName = `${safeServerName}_${mcpTool.name}`;
  
  // Convert standard schema properties slightly if needed
  // We'll pass the JSON schema directly, Gemini API usually accepts it well
  return {
    name: functionName,
    description: mcpTool.description || "No description provided.",
    parameters: mcpTool.inputSchema
  };
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { messages } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set." }, { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const mcpClients = await getMcpClients();
    
    const toolMap: Record<string, { serverName: string, originalName: string }> = {};
    const functionDeclarations = [];
    
    for (const [serverName, client] of Object.entries(mcpClients)) {
      const toolsResult = await client.listTools();
      for (const mcpTool of toolsResult.tools) {
        const geminiFunc = mcpToolToGeminiFunction(mcpTool, serverName);
        functionDeclarations.push(geminiFunc);
        toolMap[geminiFunc.name] = { serverName, originalName: mcpTool.name };
      }
    }
    
    let baseInstruction = "You are the Unified Campus Intelligence Assistant. You can help students find information across the campus including the library, cafeteria, events, and academics. If you need data, call the appropriate function.";
    
    if (session?.user) {
      const studentId = (session.user as any).id;
      baseInstruction += `\n\nCURRENT USER CONTEXT:\nYou are talking to: ${(session.user as any).name}\nStudent ID: ${studentId}\nMajor: ${(session.user as any).major}\n\nWhen fetching academic info or anything personalized, use this context if the tool allows it.`;
      
      if (mcpClients['memory']) {
        try {
          const memoryResult = await mcpClients['memory'].callTool({
            name: "get_memories",
            arguments: { studentId }
          });
          const memoryText = (memoryResult.content as any).map((c: any) => c.text).join("");
          const memoryData = JSON.parse(memoryText);
          if (memoryData.length > 0) {
            baseInstruction += `\n\nSAVED MEMORIES ABOUT USER:\n${memoryData.map((m: any) => "- " + m.memory).join("\n")}\nIMPORTANT: Use the 'save_memory' tool proactively to save any new facts or preferences the user shares.`;
          } else {
            baseInstruction += `\n\nIMPORTANT: Use the 'save_memory' tool proactively to save any new facts or preferences the user shares.`;
          }
        } catch (e) {}
      }
    } else {
      baseInstruction += `\n\nThe user is not logged in. You cannot provide personalized data.`;
    }

    const history = messages
      .slice(0, -1)
      .filter((msg: any) => msg.content && msg.content.trim() !== '')
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const chatConfig: any = {
      model: 'gemini-2.5-flash',
      config: {
        tools: [{ functionDeclarations }],
        systemInstruction: baseInstruction,
      }
    };
    if (history.length > 0) {
      chatConfig.history = history;
    }

    const chat = ai.chats.create(chatConfig);
    
    const encoder = new TextEncoder();
    
    const customStream = new ReadableStream({
      async start(controller) {
        async function processTurn(messagePayload: any) {
          const stream = await chat.sendMessageStream({ message: messagePayload });
          const collectedFunctionCalls: any[] = [];
          
          for await (const chunk of stream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
            if (chunk.functionCalls) {
              collectedFunctionCalls.push(...chunk.functionCalls);
            }
          }
          
          if (collectedFunctionCalls.length > 0) {
            const functionResponses = [];
            for (const functionCall of collectedFunctionCalls) {
              const mapping = toolMap[functionCall.name];
              if (mapping) {
                const mcpClient = mcpClients[mapping.serverName];
                try {
                  const toolResult = await mcpClient.callTool({
                    name: mapping.originalName,
                    arguments: functionCall.args
                  });
                  const extractedText = (toolResult.content as any).map((c: any) => c.text).join("\n");
                  functionResponses.push({
                     functionResponse: { name: functionCall.name, response: { result: extractedText } }
                  });
                } catch (e) {
                  functionResponses.push({
                     functionResponse: { name: functionCall.name, response: { error: String(e) } }
                  });
                }
              } else {
                functionResponses.push({
                   functionResponse: { name: functionCall.name, response: { error: "Function not found" } }
                });
              }
            }
            
            // Recurse with the function responses
            await processTurn(functionResponses);
          }
        }
        
        try {
          const userMessage = messages[messages.length - 1].content;
          await processTurn(userMessage);
          controller.close();
        } catch (e: any) {
          console.error("Streaming error:", e);
          controller.enqueue(encoder.encode("\n\n[Error: " + e.message + "]"));
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 500 });
  }
}
