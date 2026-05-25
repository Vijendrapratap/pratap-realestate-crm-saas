import { NextResponse } from "next/server";

import { callTool, createToolContext, tools } from "@/lib/agent/tools";

export const runtime = "nodejs";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "pratap-realestate-crm", version: "0.1.0" };

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function ok(id: number | string | null | undefined, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function err(
  id: number | string | null | undefined,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}

function checkAuth(request: Request): { ok: true } | { ok: false; reason: string } {
  const expected = process.env.MCP_BEARER_TOKEN;
  if (!expected) return { ok: true };
  const header = request.headers.get("authorization");
  if (!header) return { ok: false, reason: "Missing Authorization header" };
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match) return { ok: false, reason: "Expected Bearer token" };
  if (match[1] !== expected) return { ok: false, reason: "Invalid token" };
  return { ok: true };
}

async function dispatch(payload: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  switch (payload.method) {
    case "initialize":
      return ok(payload.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Pratap real estate CRM tools. Twenty CRM is the source of truth. WhatsApp and voice tools require human approval by default.",
      });
    case "notifications/initialized":
      return null;
    case "ping":
      return ok(payload.id, {});
    case "tools/list":
      return ok(payload.id, {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description + (tool.requiresApproval ? " [requires approval]" : ""),
          inputSchema: tool.inputSchema,
        })),
      });
    case "tools/call": {
      const params = payload.params ?? {};
      const name = params.name;
      if (typeof name !== "string") {
        return err(payload.id, -32602, "Missing tool name");
      }
      const args = (params.arguments as Record<string, unknown>) ?? {};
      const tenantId = typeof params._tenantId === "string" ? params._tenantId : undefined;
      const actor = typeof params._actor === "string" ? params._actor : "MCP client";
      const approved = params._approved === true;
      const ctx = createToolContext(tenantId, actor);
      const call = await callTool(name, args, ctx, { prompt: "(mcp)", approved });
      return ok(payload.id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: call.status,
                decisionId: call.decisionId,
                result: call.result,
              },
              null,
              2,
            ),
          },
        ],
        isError: call.status === "blocked",
      });
    }
    default:
      return err(payload.id, -32601, `Method not found: ${payload.method}`);
  }
}

export async function POST(request: Request) {
  const auth = checkAuth(request);
  if (!auth.ok) {
    return NextResponse.json(err(null, -32000, auth.reason), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }

  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((item) => dispatch(item as JsonRpcRequest)),
    );
    return NextResponse.json(responses.filter(Boolean));
  }

  const response = await dispatch(body as JsonRpcRequest);
  if (!response) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(response);
}

export function GET() {
  return NextResponse.json({
    server: SERVER_INFO,
    protocolVersion: PROTOCOL_VERSION,
    transport: "JSON-RPC 2.0 over HTTP POST",
    tools: tools.map((tool) => ({ name: tool.name, requiresApproval: tool.requiresApproval })),
    note: "Use POST with JSON-RPC body. Set MCP_BEARER_TOKEN for auth.",
  });
}
