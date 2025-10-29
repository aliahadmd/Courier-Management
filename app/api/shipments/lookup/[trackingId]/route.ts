import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getShipmentByTracking } from "@/lib/db/dashboard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  if (!trackingId) {
    return NextResponse.json({ error: "trackingId is required" }, { status: 400 });
  }

  const shipment = await getShipmentByTracking(trackingId);
  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json({ shipment });
}
