import type { D1Database } from "@cloudflare/workers-types";

import { calculateDashboardMetrics, calculatePerformanceSummary, generateDeliveryTrend, buildRegionPerformance, buildCourierLeaderboard } from "@/lib/metrics";
import {
  type ActivityEvent,
  type Courier,
  type Customer,
  type DashboardSnapshot,
  type DispatchRule,
  type ProofAsset,
  type Shipment,
  type SLAPolicy,
} from "@/lib/types";

import { getDatabase } from "./client";

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

type ShipmentRow = {
  id: string;
  tracking_id: string;
  order_number: string | null;
  customer_id: string;
  courier_id: string | null;
  status: string;
  created_at: string;
  pickup_scheduled_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  eta_minutes: number | null;
  last_updated: string;
  weight_kg: number | null;
  service_level: string | null;
  region: string | null;
  origin: string | null;
  destination: string | null;
  proof_asset_key: string | null;
  sla_policy_id: string | null;
};

type CourierRow = {
  id: string;
  name: string;
  avatar: string | null;
  phone: string | null;
  vehicle: string | null;
  region: string | null;
  status: string;
  last_seen: string | null;
  location_lat: number | null;
  location_lng: number | null;
  speed_kmh: number | null;
  on_time_rate: number | null;
  deliveries_today: number | null;
  distance_today_km: number | null;
  eta_variance_minutes: number | null;
  rating: number | null;
};

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  notes: string | null;
};

type EventRow = {
  id: number;
  shipment_id: string;
  status: string;
  note: string | null;
  timestamp: string;
  type: string;
  tracking_id: string;
  destination: string | null;
};

type WaypointRow = {
  shipment_id: string;
  sequence: number;
  label: string | null;
  lat: number;
  lng: number;
};

type ProofRow = {
  id: string;
  shipment_id: string;
  asset_key: string;
  kind: string;
  uploaded_by: string | null;
  uploaded_at: string;
};

type SLAPolicyRow = {
  id: string;
  name: string;
  region: string | null;
  service_level: string;
  target_minutes: number;
  cutoff_hour: number;
  created_at: string;
};

type DispatchRuleRow = {
  id: string;
  region: string | null;
  vehicle_type: string | null;
  max_active_shipments: number | null;
  enable_auto_assign: number;
  priority: number | null;
  created_at: string;
};

const mapCourierRow = (row: CourierRow): Courier => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar ?? "",
  phone: row.phone ?? "",
  vehicle: row.vehicle ?? "",
  region: row.region ?? "Unknown",
  status: (row.status as Courier["status"]) ?? "offline",
  lastSeen: row.last_seen ?? "",
  location: {
    lat: row.location_lat ?? 0,
    lng: row.location_lng ?? 0,
  },
  speedKmh: row.speed_kmh ?? 0,
  assignments: [],
  metrics: {
    onTimeRate: row.on_time_rate ?? 0,
    deliveriesToday: row.deliveries_today ?? 0,
    distanceTodayKm: row.distance_today_km ?? 0,
    averageEtaVarianceMinutes: row.eta_variance_minutes ?? 0,
    rating: row.rating ?? 0,
  },
});

const mapCustomerRow = (row: CustomerRow): Customer => ({
  id: row.id,
  name: row.name,
  email: row.email ?? "",
  phone: row.phone ?? "",
  address: row.address ?? "",
  city: row.city ?? "",
  region: row.region ?? "Unknown",
  notes: row.notes ?? undefined,
});

const mapShipmentRow = (
  row: ShipmentRow,
  timeline: Array<{ status: string; timestamp: string; note?: string | null }>,
  route: WaypointRow[],
  proofs: ProofAsset[]
): Shipment => ({
  id: row.id,
  trackingId: row.tracking_id,
  orderNumber: row.order_number ?? "",
  customerId: row.customer_id,
  courierId: row.courier_id ?? "",
  status: row.status as Shipment["status"],
  createdAt: row.created_at,
  pickupScheduledAt: row.pickup_scheduled_at ?? "",
  pickedUpAt: row.picked_up_at ?? undefined,
  deliveredAt: row.delivered_at ?? undefined,
  etaMinutes: row.eta_minutes ?? 0,
  lastUpdated: row.last_updated,
  weightKg: row.weight_kg ?? 0,
  serviceLevel: (row.service_level ?? "standard") as Shipment["serviceLevel"],
  region: row.region ?? "Unknown",
  origin: row.origin ?? "",
  destination: row.destination ?? "",
  proofAssetKey: row.proof_asset_key,
  slaPolicyId: row.sla_policy_id,
  timeline: timeline
    .map((entry) => ({
      status: entry.status,
      timestamp: entry.timestamp,
      note: entry.note ?? undefined,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  route: route
    .sort((a, b) => a.sequence - b.sequence)
    .map((waypoint) => ({
      lat: waypoint.lat,
      lng: waypoint.lng,
      label: waypoint.label ?? undefined,
    })),
  proofs,
});

async function fetchCouriers(db: D1Database): Promise<Courier[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, avatar, phone, vehicle, region, status, last_seen, location_lat, location_lng,
              speed_kmh, on_time_rate, deliveries_today, distance_today_km, eta_variance_minutes, rating
       FROM couriers`
    )
    .all<CourierRow>();

  return (results ?? []).map(mapCourierRow);
}

async function fetchCustomers(db: D1Database): Promise<Customer[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, email, phone, address, city, region, notes
       FROM customers`
    )
    .all<CustomerRow>();

  return (results ?? []).map(mapCustomerRow);
}

async function fetchSLAPolicies(db: D1Database): Promise<SLAPolicy[]> {
  const { results } = await db
    .prepare(
      `SELECT id, name, region, service_level, target_minutes, cutoff_hour, created_at
       FROM sla_policies`
    )
    .all<SLAPolicyRow>();

  return (results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    region: row.region,
    serviceLevel: row.service_level as Shipment["serviceLevel"],
    targetMinutes: row.target_minutes,
    cutoffHour: row.cutoff_hour,
    createdAt: row.created_at,
  }));
}

async function fetchDispatchRules(db: D1Database): Promise<DispatchRule[]> {
  const { results } = await db
    .prepare(
      `SELECT id, region, vehicle_type, max_active_shipments, enable_auto_assign, priority, created_at
       FROM dispatch_rules`
    )
    .all<DispatchRuleRow>();

  return (results ?? []).map((row) => ({
    id: row.id,
    region: row.region,
    vehicleType: row.vehicle_type,
    maxActiveShipments: row.max_active_shipments ?? 0,
    enableAutoAssign: !!row.enable_auto_assign,
    priority: row.priority ?? 0,
    createdAt: row.created_at,
  }));
}

async function fetchShipmentTimelines(db: D1Database, shipmentIds: string[]) {
  const timelines = new Map<
    string,
    Array<{ status: string; timestamp: string; note?: string | null }>
  >();
  const waypoints = new Map<string, WaypointRow[]>();

  if (shipmentIds.length === 0) {
    return { timelines, waypoints };
  }

  const chunks = chunkArray(shipmentIds, 90);

  for (const chunk of chunks) {
    const placeholders = chunk.map(() => "?").join(",");

    const timelineQuery = await db
      .prepare(
        `SELECT shipment_id, status, note, timestamp
         FROM shipment_events
         WHERE shipment_id IN (${placeholders})
         ORDER BY timestamp ASC`
      )
      .bind(...chunk)
      .all<{ shipment_id: string; status: string; note: string | null; timestamp: string }>();

    (timelineQuery.results ?? []).forEach((row) => {
      const list = timelines.get(row.shipment_id) ?? [];
      list.push({ status: row.status, note: row.note, timestamp: row.timestamp });
      timelines.set(row.shipment_id, list);
    });

    const waypointQuery = await db
      .prepare(
        `SELECT shipment_id, sequence, label, lat, lng
         FROM shipment_waypoints
         WHERE shipment_id IN (${placeholders})`
      )
      .bind(...chunk)
      .all<WaypointRow>();

    (waypointQuery.results ?? []).forEach((row) => {
      const list = waypoints.get(row.shipment_id) ?? [];
      list.push(row);
      waypoints.set(row.shipment_id, list);
    });
  }

  return { timelines, waypoints };
}

async function fetchShipmentProofs(db: D1Database, shipmentIds: string[]) {
  const proofs = new Map<string, ProofAsset[]>();

  if (shipmentIds.length === 0) {
    return proofs;
  }

  const chunks = chunkArray(shipmentIds, 90);

  for (const chunk of chunks) {
    const placeholders = chunk.map(() => "?").join(",");

    const proofQuery = await db
      .prepare(
        `SELECT id, shipment_id, asset_key, kind, uploaded_by, uploaded_at
         FROM shipment_proofs
         WHERE shipment_id IN (${placeholders})
         ORDER BY uploaded_at ASC`
      )
      .bind(...chunk)
      .all<ProofRow>();

    (proofQuery.results ?? []).forEach((row) => {
      const list = proofs.get(row.shipment_id) ?? [];
      list.push({
        id: row.id,
        shipmentId: row.shipment_id,
        assetKey: row.asset_key,
        kind: row.kind as ProofAsset["kind"],
        uploadedBy: row.uploaded_by,
        uploadedAt: row.uploaded_at,
      });
      proofs.set(row.shipment_id, list);
    });
  }

  return proofs;
}

async function fetchShipments(db: D1Database): Promise<Shipment[]> {
  const { results } = await db
    .prepare(
      `SELECT id, tracking_id, order_number, customer_id, courier_id, status, created_at,
              pickup_scheduled_at, picked_up_at, delivered_at, eta_minutes, last_updated,
              weight_kg, service_level, region, origin, destination, proof_asset_key, sla_policy_id
       FROM shipments`
    )
    .all<ShipmentRow>();

  const rows = results ?? [];
  const shipmentIds = rows.map((item) => item.id);
  const { timelines, waypoints } = await fetchShipmentTimelines(db, shipmentIds);
  const proofMap = await fetchShipmentProofs(db, shipmentIds);

  return rows.map((row) =>
    mapShipmentRow(
      row,
      timelines.get(row.id) ?? [],
      waypoints.get(row.id) ?? [],
      proofMap.get(row.id) ?? []
    )
  );
}

async function fetchRecentEvents(db: D1Database): Promise<ActivityEvent[]> {
  const { results } = await db
    .prepare(
      `SELECT e.id, e.shipment_id, e.status, e.note, e.timestamp, e.type,
              s.tracking_id, s.destination
       FROM shipment_events e
       INNER JOIN shipments s ON s.id = e.shipment_id
       ORDER BY e.timestamp DESC
       LIMIT 12`
    )
    .all<EventRow>();

  return (results ?? []).map((row) => ({
    id: `${row.id}`,
    timestamp: row.timestamp,
    title: row.status,
    description:
      row.note ??
      `Shipment ${row.tracking_id} · ${row.destination ?? "Unknown destination"}`,
    type: row.type as ActivityEvent["type"],
  }));
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const db = await getDatabase();
  const [courierRows, customers, shipments, recentEvents, slaPolicies, dispatchRules] =
    await Promise.all([
      fetchCouriers(db),
      fetchCustomers(db),
      fetchShipments(db),
      fetchRecentEvents(db),
      fetchSLAPolicies(db),
      fetchDispatchRules(db),
    ]);

  const assignments = new Map<string, string[]>();
  shipments.forEach((shipment) => {
    if (!shipment.courierId) return;
    const list = assignments.get(shipment.courierId) ?? [];
    list.push(shipment.id);
    assignments.set(shipment.courierId, list);
  });

  const couriers: Courier[] = courierRows.map((courier) => ({
    ...courier,
    assignments: assignments.get(courier.id) ?? [],
  }));

  const metrics = calculateDashboardMetrics(shipments, couriers);
  const performance = calculatePerformanceSummary(shipments, couriers);
  const trend = generateDeliveryTrend(shipments);
  const regionPerformance = buildRegionPerformance(shipments);
  const leaderboard = buildCourierLeaderboard(couriers);

  return {
    generatedAt: new Date().toISOString(),
    couriers,
    customers,
    shipments,
    metrics,
    performance,
    trend,
    regionPerformance,
    leaderboard,
    recentEvents,
     slaPolicies,
     dispatchRules,
  };
}

export async function getShipmentByTracking(trackingId: string) {
  const db = await getDatabase();
  const row = await db
    .prepare(
      `SELECT id, tracking_id, order_number, customer_id, courier_id, status, created_at,
              pickup_scheduled_at, picked_up_at, delivered_at, eta_minutes, last_updated,
              weight_kg, service_level, region, origin, destination, proof_asset_key, sla_policy_id
       FROM shipments
       WHERE tracking_id = ?
       LIMIT 1`
    )
    .bind(trackingId)
    .first<ShipmentRow>();

  if (!row) return null;

  const { timelines, waypoints } = await fetchShipmentTimelines(db, [row.id]);
  const proofs = await fetchShipmentProofs(db, [row.id]);

  return mapShipmentRow(
    row,
    timelines.get(row.id) ?? [],
    waypoints.get(row.id) ?? [],
    proofs.get(row.id) ?? []
  );
}
