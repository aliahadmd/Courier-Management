import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { deleteDispatchRule, updateDispatchRule } from "@/lib/db/mutations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await params;

  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
  }

  const payload = (await request.json()) as Partial<{
    region: string | null;
    vehicleType: string | null;
    maxActiveShipments: number;
    enableAutoAssign: boolean;
    priority: number;
  }>;

  await updateDispatchRule(ruleId, {
    region: payload.region,
    vehicleType: payload.vehicleType,
    maxActiveShipments:
      typeof payload.maxActiveShipments === "number" ? payload.maxActiveShipments : undefined,
    enableAutoAssign:
      typeof payload.enableAutoAssign === "boolean" ? payload.enableAutoAssign : undefined,
    priority: typeof payload.priority === "number" ? payload.priority : undefined,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await params;

  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
  }

  await deleteDispatchRule(ruleId);
  return NextResponse.json({ ok: true });
}
