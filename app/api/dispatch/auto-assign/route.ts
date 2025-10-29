import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { autoAssignShipments } from "@/lib/db/mutations";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { shipmentIds?: unknown };
  const shipmentIds = Array.isArray(payload?.shipmentIds)
    ? payload.shipmentIds.filter((id: unknown): id is string => typeof id === "string")
    : [];

  if (shipmentIds.length === 0) {
    return NextResponse.json({ error: "shipmentIds array is required" }, { status: 400 });
  }

  const assignments = await autoAssignShipments(shipmentIds);
  return NextResponse.json({ assignments });
}
