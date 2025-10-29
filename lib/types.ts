export type Role = "admin" | "courier" | "customer";

export type DeliveryStatus = "pending" | "in_transit" | "delayed" | "delivered";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Courier {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  vehicle: string;
  region: string;
  status: "online" | "offline" | "break";
  lastSeen: string;
  location: GeoPoint;
  speedKmh: number;
  assignments: string[];
  metrics: {
    onTimeRate: number;
    deliveriesToday: number;
    distanceTodayKm: number;
    averageEtaVarianceMinutes: number;
    rating: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  notes?: string;
}

export interface ShipmentTimelineEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Shipment {
  id: string;
  trackingId: string;
  orderNumber: string;
  customerId: string;
  courierId: string;
  status: DeliveryStatus;
  createdAt: string;
  pickupScheduledAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  etaMinutes: number;
  lastUpdated: string;
  weightKg: number;
  serviceLevel: "same_day" | "next_day" | "standard";
  region: string;
  origin: string;
  destination: string;
  timeline: ShipmentTimelineEntry[];
  route: (GeoPoint & { label?: string })[];
  proofAssetKey?: string | null;
  slaPolicyId?: string | null;
  proofs?: ProofAsset[];
}

export interface PerformanceSummary {
  period: "today" | "week" | "month";
  deliveries: number;
  onTimeRate: number;
  delayed: number;
  averageEtaVarianceMinutes: number;
  kmTravelled: number;
  carbonEstimateKg: number;
}

export interface TrendPoint {
  label: string;
  delivered: number;
  delayed: number;
  inTransit: number;
}

export interface CourierLeaderboardEntry {
  courierId: string;
  name: string;
  avatar: string;
  deliveries: number;
  onTimeRate: number;
  satisfaction: number;
}

export interface RegionPerformanceEntry {
  region: string;
  deliveries: number;
  successRate: number;
  averageEtaVarianceMinutes: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: "status" | "handoff" | "alert";
}

export interface RoleCredentials {
  username: string;
  password: string;
  role: Role;
  displayName: string;
  contextId?: string;
}

export interface DashboardSnapshot {
  generatedAt: string;
  metrics: DashboardMetrics;
  couriers: Courier[];
  customers: Customer[];
  shipments: Shipment[];
  performance: PerformanceSummary[];
  trend: TrendPoint[];
  leaderboard: CourierLeaderboardEntry[];
  regionPerformance: RegionPerformanceEntry[];
  recentEvents: ActivityEvent[];
  slaPolicies: SLAPolicy[];
  dispatchRules: DispatchRule[];
}

export interface SLAPolicy {
  id: string;
  name: string;
  region: string | null;
  serviceLevel: Shipment["serviceLevel"];
  targetMinutes: number;
  cutoffHour: number;
  createdAt: string;
}

export interface DispatchRule {
  id: string;
  region: string | null;
  vehicleType: string | null;
  maxActiveShipments: number;
  enableAutoAssign: boolean;
  priority: number;
  createdAt: string;
}

export interface ProofAsset {
  id: string;
  shipmentId: string;
  assetKey: string;
  kind: "photo" | "signature" | "document";
  uploadedBy?: string | null;
  uploadedAt: string;
}
import type { DashboardMetrics } from "./metrics";
