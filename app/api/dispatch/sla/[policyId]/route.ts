import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { deleteSlaPolicy, upsertSlaPolicy } from "@/lib/db/mutations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await params;

  if (!policyId) {
    return NextResponse.json({ error: "policyId is required" }, { status: 400 });
  }

  const payload = (await request.json()) as Partial<{
    name: string;
    region: string | null;
    serviceLevel: string;
    targetMinutes: number;
    cutoffHour: number;
  }>;

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (typeof payload.serviceLevel !== "string") {
    return NextResponse.json({ error: "serviceLevel is required" }, { status: 400 });
  }

  const normalizedValue = payload.serviceLevel
    ? payload.serviceLevel.toString().toLowerCase()
    : "standard";

  const normalizedServiceLevel = ["same_day", "next_day", "standard"].includes(
    normalizedValue
  )
    ? (normalizedValue as "same_day" | "next_day" | "standard")
    : "standard";

  const policy = await upsertSlaPolicy({
    id: policyId,
    name: payload.name.trim(),
    region: payload.region ?? null,
    serviceLevel: normalizedServiceLevel,
    targetMinutes: Number(payload.targetMinutes ?? 0) || 0,
    cutoffHour: typeof payload.cutoffHour === "number" ? payload.cutoffHour : 17,
  });

  return NextResponse.json(policy);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await params;

  if (!policyId) {
    return NextResponse.json({ error: "policyId is required" }, { status: 400 });
  }

  await deleteSlaPolicy(policyId);
  return NextResponse.json({ ok: true });
}
