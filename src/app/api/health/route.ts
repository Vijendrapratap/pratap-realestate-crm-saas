import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HealthPayload = {
  ok: true;
  service: string;
  environment: string;
  timestamp: string;
  version: string;
};

export function GET() {
  const payload: HealthPayload = {
    ok: true,
    service: "pratap-realestate-crm-backend",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
