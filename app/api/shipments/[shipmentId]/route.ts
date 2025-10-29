import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  autoAssignShipment,
  updateShipmentAssignment,
  updateShipmentSlaPolicy,
  updateShipmentStatus,
} from "@/lib/db/mutations";
import type { DeliveryStatus } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;

  if (typeof shipmentId !== "string" || shipmentId.length === 0) {
    return NextResponse.json({ error: "Missing shipment id" }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  if (typeof body.courierId !== "undefined") {
    await updateShipmentAssignment(
      shipmentId,
      typeof body.courierId === "string" && body.courierId.length > 0
        ? body.courierId
        : null
    );
  }

  if (typeof body.slaPolicyId !== "undefined") {
    await updateShipmentSlaPolicy(
      shipmentId,
      typeof body.slaPolicyId === "string" && body.slaPolicyId.length > 0
        ? body.slaPolicyId
        : null
    );
  }

  if (typeof body.status !== "undefined") {
    await updateShipmentStatus({
      shipmentId,
      status: body.status as DeliveryStatus,
      note: typeof body.note === "string" ? body.note : undefined,
      etaMinutes: typeof body.etaMinutes === "number" ? (body.etaMinutes as number) : undefined,
    });
  }

  if (body.autoAssign === true) {
    await autoAssignShipment(shipmentId);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
