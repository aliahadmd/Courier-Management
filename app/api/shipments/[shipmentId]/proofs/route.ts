import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/db/client";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;

  if (!shipmentId) {
    return NextResponse.json({ error: "Missing shipment id" }, { status: 400 });
  }

  const db = await getDatabase();
  const { results } = await db
    .prepare(
      `SELECT id, shipment_id, asset_key, kind, uploaded_by, uploaded_at
       FROM shipment_proofs
       WHERE shipment_id = ?
       ORDER BY uploaded_at ASC`
    )
    .bind(shipmentId)
    .all<{
      id: string;
      shipment_id: string;
      asset_key: string;
      kind: string;
      uploaded_by: string | null;
      uploaded_at: string;
    }>();

  return NextResponse.json({
    proofs: (results ?? []).map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      assetKey: row.asset_key,
      kind: row.kind,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
    })),
  });
}
