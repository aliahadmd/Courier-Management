import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { upsertSlaPolicy } from "@/lib/db/mutations";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<{
    name: string;
    region: string | null;
    serviceLevel: string;
    targetMinutes: number;
    cutoffHour: number;
  }>;

  if (!payload || typeof payload.name !== "string" || !payload.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (typeof payload.serviceLevel !== "string") {
    return NextResponse.json({ error: "serviceLevel is required" }, { status: 400 });
  }

  const name = payload.name.trim();
  const serviceLevel = payload.serviceLevel as string;

  const normalizedServiceLevel = ["same_day", "next_day", "standard"].includes(
    serviceLevel
  )
    ? (serviceLevel as "same_day" | "next_day" | "standard")
    : "standard";

  const policy = await upsertSlaPolicy({
    name,
    region: payload.region ?? null,
    serviceLevel: normalizedServiceLevel,
    targetMinutes: Number(payload.targetMinutes ?? 0) || 0,
    cutoffHour: typeof payload.cutoffHour === "number" ? payload.cutoffHour : 17,
  });

  return NextResponse.json(policy, { status: 201 });
}
