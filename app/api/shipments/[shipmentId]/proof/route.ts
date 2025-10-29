import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { uploadProofOfDelivery } from "@/lib/db/mutations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;

  if (typeof shipmentId !== "string" || shipmentId.length === 0) {
    return NextResponse.json({ error: "Missing shipment id" }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kindValue = (form.get("kind") ?? "photo").toString().toLowerCase();
  const uploadedBy = form.get("uploadedBy")?.toString();

  const kind = ["photo", "signature", "document"].includes(kindValue)
    ? (kindValue as "photo" | "signature" | "document")
    : "photo";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
  }

  const key = await uploadProofOfDelivery(shipmentId, file, {
    kind,
    uploadedBy: uploadedBy ?? undefined,
  });

  return NextResponse.json({ ok: true, key }, { status: 201 });
}
