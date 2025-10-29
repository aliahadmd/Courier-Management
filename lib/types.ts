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

export interface RoleCredentials {
  username: string;
  password: string;
  role: Role;
  displayName: string;
  contextId?: string;
}
