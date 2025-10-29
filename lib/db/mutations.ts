import type { D1Database } from "@cloudflare/workers-types";

import type { DeliveryStatus, DispatchRule, Shipment, SLAPolicy } from "@/lib/types";

import { getDatabase, getProofBucket } from "./client";

const STATUS_EVENT_TYPE: Record<DeliveryStatus, "status" | "alert"> = {
  pending: "status",
  in_transit: "status",
  delayed: "alert",
  delivered: "status",
};

export async function updateShipmentAssignment(
  shipmentId: string,
  courierId: string | null
) {
  const db = await getDatabase();

  await db
    .prepare(
      `UPDATE shipments
       SET courier_id = ?, last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(courierId, shipmentId)
    .run();

  await db
    .prepare(
      `INSERT INTO shipment_events (shipment_id, status, note, type)
       VALUES (?, ?, ?, ?)`
    )
    .bind(
      shipmentId,
      "Assignment updated",
      courierId ? `Assigned to courier ${courierId}` : "Courier unassigned",
      "handoff"
    )
    .run();
}

export async function updateShipmentSlaPolicy(
  shipmentId: string,
  slaPolicyId: string | null
) {
  const db = await getDatabase();

  await db
    .prepare(
      `UPDATE shipments
       SET sla_policy_id = ?, last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(slaPolicyId, shipmentId)
    .run();

  await db
    .prepare(
      `INSERT INTO shipment_events (shipment_id, status, note, type)
       VALUES (?, ?, ?, ?)`
    )
    .bind(
      shipmentId,
      "SLA policy updated",
      slaPolicyId ? `Linked to SLA ${slaPolicyId}` : "Cleared SLA policy",
      "status"
    )
    .run();
}

export async function updateShipmentStatus(options: {
  shipmentId: string;
  status: DeliveryStatus;
  note?: string;
  etaMinutes?: number;
}) {
  const { shipmentId, status, note, etaMinutes } = options;
  const db = await getDatabase();

  const setStatements: string[] = ["status = ?", "last_updated = CURRENT_TIMESTAMP"];
  const bindings: Array<string | number | null> = [status];

  if (typeof etaMinutes === "number") {
    setStatements.push("eta_minutes = ?");
    bindings.push(etaMinutes);
  }

  if (status === "in_transit") {
    setStatements.push("picked_up_at = COALESCE(picked_up_at, CURRENT_TIMESTAMP)");
  }

  if (status === "delivered") {
    setStatements.push("delivered_at = CURRENT_TIMESTAMP");
  }

  bindings.push(shipmentId);

  await db
    .prepare(
      `UPDATE shipments
       SET ${setStatements.join(", ")}
       WHERE id = ?`
    )
    .bind(...bindings)
    .run();

  await db
    .prepare(
      `INSERT INTO shipment_events (shipment_id, status, note, type)
       VALUES (?, ?, ?, ?)`
    )
    .bind(
      shipmentId,
      `Status → ${status.replace("_", " ")}`,
      note ?? (status === "delivered" ? "Proof pending upload." : null),
      STATUS_EVENT_TYPE[status]
    )
    .run();
}

export async function uploadProofOfDelivery(
  shipmentId: string,
  file: File,
  options?: { kind?: "photo" | "signature" | "document"; uploadedBy?: string }
) {
  const bucket = await getProofBucket();
  const db = await getDatabase();

  const key = `proofs/${shipmentId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  await db
    .prepare(
      `UPDATE shipments
       SET proof_asset_key = ?, last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(key, shipmentId)
    .run();

  await db
    .prepare(
      `INSERT INTO shipment_proofs (id, shipment_id, asset_key, kind, uploaded_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      shipmentId,
      key,
      options?.kind ?? "photo",
      options?.uploadedBy ?? "courier"
    )
    .run();

  await db
    .prepare(
      `INSERT INTO shipment_events (shipment_id, status, note, type)
       VALUES (?, ?, ?, ?)`
    )
    .bind(shipmentId, "Proof of delivery uploaded", file.name, "handoff")
    .run();

  return key;
}

export interface CreateShipmentInput {
  trackingId: string;
  orderNumber?: string;
  customerId: string;
  courierId?: string | null;
  status?: DeliveryStatus;
  serviceLevel: Shipment["serviceLevel"];
  region: string;
  origin: string;
  destination: string;
  etaMinutes?: number;
  weightKg?: number;
  pickupScheduledAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  slaPolicyId?: string | null;
}

async function resolveSlaPolicyId(
  db: D1Database,
  region: string | null,
  serviceLevel: Shipment["serviceLevel"]
) {
  const { results } = await db
    .prepare(
      `SELECT id
       FROM sla_policies
       WHERE service_level = ?
         AND (region IS NULL OR region = ?)
       ORDER BY CASE WHEN region = ? THEN 0 ELSE 1 END, target_minutes ASC
       LIMIT 1`
    )
    .bind(serviceLevel, region ?? null, region ?? null)
    .all<{ id: string }>();

  return results && results[0] ? results[0].id : null;
}

export async function createShipment(
  input: CreateShipmentInput,
  options?: { autoAssign?: boolean }
) {
  const db = await getDatabase();
  const shipmentId = `ship-${crypto.randomUUID()}`;
  const slaPolicyId =
    input.slaPolicyId ?? (await resolveSlaPolicyId(db, input.region, input.serviceLevel));

  await db
    .prepare(
      `INSERT INTO shipments (
        id, tracking_id, order_number, customer_id, courier_id, status,
        created_at, pickup_scheduled_at, picked_up_at, delivered_at,
        eta_minutes, last_updated, weight_kg, service_level, region,
        origin, destination, proof_asset_key, sla_policy_id
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, NULL, ?)`
    )
    .bind(
      shipmentId,
      input.trackingId,
      input.orderNumber ?? null,
      input.customerId,
      input.courierId ?? null,
      input.status ?? "pending",
      input.pickupScheduledAt ?? null,
      input.pickedUpAt ?? null,
      input.deliveredAt ?? null,
      input.etaMinutes ?? 0,
      input.weightKg ?? 0,
      input.serviceLevel,
      input.region,
      input.origin,
      input.destination,
      slaPolicyId
    )
    .run();

  await db
    .prepare(
      `INSERT INTO shipment_events (shipment_id, status, note, type)
       VALUES (?, ?, ?, ?)`
    )
    .bind(shipmentId, "Label Created", null, "status")
    .run();

  let assignedCourierId: string | null = input.courierId ?? null;

  if (!assignedCourierId && options?.autoAssign) {
    assignedCourierId = await autoAssignShipment(shipmentId);
  } else if (assignedCourierId) {
    await updateShipmentAssignment(shipmentId, assignedCourierId);
  }

  return { id: shipmentId, courierId: assignedCourierId, slaPolicyId };
}

export async function autoAssignShipment(shipmentId: string) {
  const db = await getDatabase();

  const shipment = await db
    .prepare(
      `SELECT region, service_level
       FROM shipments
       WHERE id = ?`
    )
    .bind(shipmentId)
    .first<{ region: string | null; service_level: string | null }>();

  if (!shipment) {
    return null;
  }

  const region = shipment.region ?? null;

  const couriersQuery = await db
    .prepare(
      `SELECT id, region, vehicle, status
       FROM couriers`
    )
    .all<{ id: string; region: string | null; vehicle: string | null; status: string }>();

  const activeCountsQuery = await db
    .prepare(
      `SELECT courier_id AS id, COUNT(*) AS total
       FROM shipments
       WHERE courier_id IS NOT NULL
         AND status IN ('pending', 'in_transit', 'delayed')
       GROUP BY courier_id`
    )
    .all<{ id: string; total: number }>();

  const counts = new Map(activeCountsQuery.results?.map((row) => [row.id, Number(row.total)]) ?? []);

  const dispatchRuleQuery = await db
    .prepare(
      `SELECT id, region, vehicle_type, max_active_shipments, enable_auto_assign, priority
       FROM dispatch_rules`
    )
    .all<{ id: string; region: string | null; vehicle_type: string | null; max_active_shipments: number | null; enable_auto_assign: number; priority: number | null }>();

  const dispatchRules = (dispatchRuleQuery.results ?? []).map((row) => ({
    id: row.id,
    region: row.region,
    vehicleType: row.vehicle_type,
    maxActiveShipments: row.max_active_shipments ?? 0,
    enableAutoAssign: !!row.enable_auto_assign,
    priority: row.priority ?? 0,
  }));

  const orderedRules = dispatchRules
    .filter((rule) => !rule.region || rule.region === region)
    .filter((rule) => rule.enableAutoAssign)
    .sort((a, b) => b.priority - a.priority);

  const couriers = couriersQuery.results ?? [];

  const findCandidate = () => {
    for (const rule of orderedRules) {
      const candidates = couriers.filter((courier) => {
        if (courier.status === "offline") return false;
        if (region && courier.region && courier.region !== region) return false;
        if (rule.vehicleType && courier.vehicle !== rule.vehicleType) return false;
        const current = counts.get(courier.id) ?? 0;
        if (rule.maxActiveShipments && rule.maxActiveShipments > 0 && current >= rule.maxActiveShipments) {
          return false;
        }
        return true;
      });

      if (candidates.length > 0) {
        return candidates.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
      }
    }

    return couriers
      .filter((courier) => courier.status !== "offline" && (!region || !courier.region || courier.region === region))
      .sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
  };

  const picked = findCandidate();
  if (!picked) {
    return null;
  }

  await updateShipmentAssignment(shipmentId, picked.id);
  return picked.id;
}

export async function autoAssignShipments(shipmentIds: string[]) {
  const results: Record<string, string | null> = {};
  for (const id of shipmentIds) {
    results[id] = await autoAssignShipment(id);
  }
  return results;
}

export async function createBulkImportJob(
  filename: string,
  totals: { totalRows: number }
) {
  const db = await getDatabase();
  const jobId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO bulk_import_jobs (id, filename, status, total_rows, created_at)
       VALUES (?, ?, 'processing', ?, CURRENT_TIMESTAMP)`
    )
    .bind(jobId, filename, totals.totalRows)
    .run();
  return jobId;
}

export async function finalizeBulkImportJob(jobId: string, summary: {
  processed: number;
  failed: number;
  errors?: string | null;
}) {
  const db = await getDatabase();
  const status = summary.failed > 0 ? "completed" : "completed";
  await db
    .prepare(
      `UPDATE bulk_import_jobs
       SET status = ?, processed_rows = ?, failed_rows = ?, error_details = ?, completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(status, summary.processed, summary.failed, summary.errors ?? null, jobId)
    .run();
}

export async function recordBulkImportFailure(jobId: string, message: string) {
  const db = await getDatabase();
  await db
    .prepare(
      `UPDATE bulk_import_jobs
       SET status = 'failed', error_details = ?, completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(message, jobId)
    .run();
}

export interface CustomerInput {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  notes?: string;
}

export async function ensureCustomer(input: CustomerInput) {
  const db = await getDatabase();

  if (input.id) {
    return input.id;
  }

  if (input.email) {
    const existing = await db
      .prepare(`SELECT id FROM customers WHERE email = ? LIMIT 1`)
      .bind(input.email)
      .first<{ id: string }>();
    if (existing?.id) {
      return existing.id;
    }
  }

  const customerId = `cust-${crypto.randomUUID()}`;
  await db
    .prepare(
      `INSERT INTO customers (id, name, email, phone, address, city, region, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      customerId,
      input.name,
      input.email ?? null,
      input.phone ?? null,
      input.address ?? null,
      input.city ?? null,
      input.region ?? null,
      input.notes ?? null
    )
    .run();

  return customerId;
}

export interface DispatchRuleInput {
  region?: string | null;
  vehicleType?: string | null;
  maxActiveShipments?: number;
  enableAutoAssign?: boolean;
  priority?: number;
}

export async function createDispatchRule(input: DispatchRuleInput): Promise<DispatchRule> {
  const db = await getDatabase();
  const id = `rule-${crypto.randomUUID()}`;
  await db
    .prepare(
      `INSERT INTO dispatch_rules (id, region, vehicle_type, max_active_shipments, enable_auto_assign, priority)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.region ?? null,
      input.vehicleType ?? null,
      input.maxActiveShipments ?? 0,
      input.enableAutoAssign === false ? 0 : 1,
      input.priority ?? 0
    )
    .run();

  return {
    id,
    region: input.region ?? null,
    vehicleType: input.vehicleType ?? null,
    maxActiveShipments: input.maxActiveShipments ?? 0,
    enableAutoAssign: input.enableAutoAssign !== false,
    priority: input.priority ?? 0,
    createdAt: new Date().toISOString(),
  };
}

export async function updateDispatchRule(id: string, input: DispatchRuleInput) {
  const db = await getDatabase();
  const statements: string[] = [];
  const bindings: Array<string | number | null> = [];

  if (input.region !== undefined) {
    statements.push("region = ?");
    bindings.push(input.region);
  }
  if (input.vehicleType !== undefined) {
    statements.push("vehicle_type = ?");
    bindings.push(input.vehicleType);
  }
  if (input.maxActiveShipments !== undefined) {
    statements.push("max_active_shipments = ?");
    bindings.push(input.maxActiveShipments);
  }
  if (input.enableAutoAssign !== undefined) {
    statements.push("enable_auto_assign = ?");
    bindings.push(input.enableAutoAssign ? 1 : 0);
  }
  if (input.priority !== undefined) {
    statements.push("priority = ?");
    bindings.push(input.priority);
  }

  if (statements.length === 0) return;

  bindings.push(id);

  await db
    .prepare(
      `UPDATE dispatch_rules
       SET ${statements.join(", ")}
       WHERE id = ?`
    )
    .bind(...bindings)
    .run();
}

export async function deleteDispatchRule(id: string) {
  const db = await getDatabase();
  await db.prepare(`DELETE FROM dispatch_rules WHERE id = ?`).bind(id).run();
}

export interface SLAPolicyInput {
  id?: string;
  name: string;
  region?: string | null;
  serviceLevel: Shipment["serviceLevel"];
  targetMinutes: number;
  cutoffHour?: number;
}

export async function upsertSlaPolicy(input: SLAPolicyInput): Promise<SLAPolicy> {
  const db = await getDatabase();
  const id = input.id ?? `sla-${crypto.randomUUID()}`;

  if (input.id) {
    await db
      .prepare(
        `UPDATE sla_policies
         SET name = ?, region = ?, service_level = ?, target_minutes = ?, cutoff_hour = ?
         WHERE id = ?`
      )
      .bind(
        input.name,
        input.region ?? null,
        input.serviceLevel,
        input.targetMinutes,
        input.cutoffHour ?? 17,
        id
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO sla_policies (id, name, region, service_level, target_minutes, cutoff_hour)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        input.name,
        input.region ?? null,
        input.serviceLevel,
        input.targetMinutes,
        input.cutoffHour ?? 17
      )
      .run();
  }

  return {
    id,
    name: input.name,
    region: input.region ?? null,
    serviceLevel: input.serviceLevel,
    targetMinutes: input.targetMinutes,
    cutoffHour: input.cutoffHour ?? 17,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteSlaPolicy(id: string) {
  const db = await getDatabase();
  await db.prepare(`DELETE FROM sla_policies WHERE id = ?`).bind(id).run();
}
