import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createBulkImportJob,
  createShipment,
  ensureCustomer,
  finalizeBulkImportJob,
  recordBulkImportFailure,
  type CreateShipmentInput,
} from "@/lib/db/mutations";

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const filtered = lines.filter((line) => line.length > 0);
  if (filtered.length <= 1) return [];

  const headers = filtered[0].split(",").map((value) => value.trim().toLowerCase());
  const rows = filtered.slice(1).map((line) => {
    const values = line.split(",");
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] ?? "").trim();
    });
    return record;
  });

  return rows;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const autoAssign = form.get("autoAssign")?.toString() !== "false";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const content = await file.text();
  const rows = parseCsv(content);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data found in CSV" }, { status: 400 });
  }

  const jobId = await createBulkImportJob(file.name, { totalRows: rows.length });
  const errors: Array<{ row: number; error: string }> = [];
  let processed = 0;
  let failed = 0;
  const created: string[] = [];

  try {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      try {
        const trackingId = row["tracking_id"] ?? row["trackingid"] ?? row["tracking"];
        const destination = row["destination"];
        const origin = row["origin"] ?? row["pickup"] ?? "";
        const region = row["region"] ?? "";
        const customerName = row["customer_name"] ?? row["name"];

        if (!trackingId || !destination || !customerName || !region) {
          throw new Error("Missing required fields (tracking_id, destination, customer_name, region)");
        }

        const customerId = await ensureCustomer({
          name: customerName,
          email: row["customer_email"] ?? row["email"],
          phone: row["customer_phone"] ?? row["phone"],
          address: row["address"],
          city: row["city"] ?? row["customer_city"],
          region,
          notes: row["notes"],
        });

        const serviceLevel = (row["service_level"] ?? "standard").toLowerCase();

        const input: CreateShipmentInput = {
          trackingId,
          orderNumber: row["order_number"] ?? row["order"] ?? null,
          customerId,
          serviceLevel: ["same_day", "next_day", "standard"].includes(serviceLevel)
            ? (serviceLevel as CreateShipmentInput["serviceLevel"])
            : "standard",
          region,
          origin: origin || `Default Hub (${region})`,
          destination,
          etaMinutes: row["eta_minutes"] ? Number(row["eta_minutes"]) : undefined,
          weightKg: row["weight_kg"] ? Number(row["weight_kg"]) : undefined,
          pickupScheduledAt: row["pickup_scheduled_at"] ?? null,
          slaPolicyId: row["sla_policy_id"] ?? null,
        };

        const result = await createShipment(input, { autoAssign });
        processed += 1;
        created.push(result.id);
      } catch (error) {
        failed += 1;
        errors.push({
          row: index + 2, // account for header
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await finalizeBulkImportJob(jobId, {
      processed,
      failed,
      errors: errors.length ? JSON.stringify(errors.slice(0, 20)) : null,
    });
  } catch (error) {
    await recordBulkImportFailure(
      jobId,
      error instanceof Error ? error.message : "Bulk import failed"
    );
    return NextResponse.json(
      { jobId, error: error instanceof Error ? error.message : "Bulk import failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ jobId, processed, failed, created, errors });
}
