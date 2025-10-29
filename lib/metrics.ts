import {
  type Courier,
  type CourierLeaderboardEntry,
  type PerformanceSummary,
  type RegionPerformanceEntry,
  type Shipment,
  type TrendPoint,
} from "./types";

export interface DashboardMetrics {
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  delayedShipments: number;
  activeCouriers: number;
  deliverySuccessRate: number;
  deliveredToday: number;
  averageDeliveryTimeMinutes: number;
}

const diffMinutes = (end?: string, start?: string) => {
  if (!end || !start) return null;
  const endDate = new Date(end);
  const startDate = new Date(start);
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
};

const isSameDay = (iso?: string) => {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
};

const toDate = (value?: string | null) => (value ? new Date(value) : null);

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
};

export function calculateDashboardMetrics(
  shipments: Shipment[],
  couriers: Courier[]
): DashboardMetrics {
  const totalShipments = shipments.length;
  const deliveredShipments = shipments.filter((s) => s.status === "delivered").length;
  const pendingShipments = shipments.filter((s) => s.status === "pending").length;
  const inTransitShipments = shipments.filter((s) => s.status === "in_transit").length;
  const delayedShipments = shipments.filter((s) => s.status === "delayed").length;

  const successful = deliveredShipments;
  const impacted = delayedShipments;
  const totalMeasured = successful + impacted;
  const deliverySuccessRate =
    totalMeasured === 0 ? 0 : Math.round((successful / totalMeasured) * 1000) / 10;

  const deliveredToday = shipments.filter(
    (shipment) => shipment.status === "delivered" && isSameDay(shipment.deliveredAt)
  ).length;

  const deliveryDurations = shipments
    .map((shipment) => diffMinutes(shipment.deliveredAt, shipment.pickedUpAt))
    .filter((value): value is number => value !== null);

  const averageDeliveryTimeMinutes =
    deliveryDurations.length > 0
      ? Math.round(
          deliveryDurations.reduce((acc, value) => acc + value, 0) /
            deliveryDurations.length
        )
      : 0;

  const activeCouriers = couriers.filter((courier) => courier.status !== "offline").length;

  return {
    totalShipments,
    deliveredShipments,
    pendingShipments,
    inTransitShipments,
    delayedShipments,
    activeCouriers,
    deliverySuccessRate,
    deliveredToday,
    averageDeliveryTimeMinutes,
  };
}

const haversineDistanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const c =
    2 *
    Math.asin(
      Math.sqrt(
        sinDLat * sinDLat +
          Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
      )
    );
  return R * c;
};

const estimateRouteDistance = (route: Shipment["route"]) => {
  if (!route || route.length < 2) return 5;
  let distance = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    distance += haversineDistanceKm(route[i], route[i + 1]);
  }
  return Math.max(distance, 2);
};

export function getCourierAssignments(courierId: string, shipments: Shipment[]) {
  return shipments.filter((shipment) => shipment.courierId === courierId);
}

export function getCustomerShipments(customerId: string, shipments: Shipment[]) {
  return shipments.filter((shipment) => shipment.customerId === customerId);
}

export function getShipmentsByStatus(shipments: Shipment[]) {
  return shipments.reduce<Record<string, Shipment[]>>((acc, shipment) => {
    acc[shipment.status] = acc[shipment.status] ?? [];
    acc[shipment.status].push(shipment);
    return acc;
  }, {});
}

export function getAverageEtaVariance(shipments: Shipment[]) {
  const variances = shipments
    .map((shipment) => {
      if (!shipment.deliveredAt || !shipment.pickedUpAt) return null;
      const actual = diffMinutes(shipment.deliveredAt, shipment.pickedUpAt);
      if (actual === null) return null;
      return actual - shipment.etaMinutes;
    })
    .filter((value): value is number => value !== null);

  if (variances.length === 0) return 0;
  return Math.round(
    (variances.reduce((acc, value) => acc + value, 0) / variances.length) * 10
  ) / 10;
}

export function calculatePerformanceSummary(
  shipments: Shipment[],
  couriers: Courier[]
): PerformanceSummary[] {
  const now = new Date();

  const descriptors: Array<{ period: PerformanceSummary["period"]; windowStart: Date }> = [
    { period: "today", windowStart: startOfDay(now) },
    { period: "week", windowStart: addDays(startOfDay(now), -6) },
    { period: "month", windowStart: addDays(startOfDay(now), -29) },
  ];

  return descriptors.map(({ period, windowStart }) => {
    const relevantShipments = shipments.filter(
      (shipment) => toDate(shipment.createdAt)! >= windowStart
    );
    const delivered = relevantShipments.filter((shipment) => shipment.status === "delivered");
    const delayed = relevantShipments.filter((shipment) => shipment.status === "delayed");
    const deliveredCount = delivered.length;
    const delayedCount = delayed.length;
    const measured = deliveredCount + delayedCount;

    const kmTravelled = relevantShipments.reduce((acc, shipment) => {
      return acc + estimateRouteDistance(shipment.route);
    }, 0);

    const averageEtaVariance =
      relevantShipments.length > 0 ? getAverageEtaVariance(relevantShipments) : 0;

    const onTimeRate = measured === 0 ? 0 : deliveredCount / measured;
    const carbonEstimateKg = Math.round(kmTravelled * 0.09 * 10) / 10;

    return {
      period,
      deliveries: deliveredCount,
      onTimeRate: Math.min(onTimeRate, 1),
      delayed: delayedCount,
      averageEtaVarianceMinutes: averageEtaVariance,
      kmTravelled: Math.round(kmTravelled),
      carbonEstimateKg,
    };
  });
}

export function generateDeliveryTrend(shipments: Shipment[]): TrendPoint[] {
  const now = startOfDay(new Date());
  const days: TrendPoint[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const dayStart = addDays(now, -i);
    const dayEnd = addDays(dayStart, 1);
    const delivered = shipments.filter((shipment) => {
      const deliveredAt = toDate(shipment.deliveredAt);
      return deliveredAt && deliveredAt >= dayStart && deliveredAt < dayEnd;
    }).length;

    const delayed = shipments.filter((shipment) => {
      const lastUpdated = toDate(shipment.lastUpdated);
      return shipment.status === "delayed" && lastUpdated && lastUpdated >= dayStart && lastUpdated < dayEnd;
    }).length;

    const inTransit = shipments.filter((shipment) => {
      const lastUpdated = toDate(shipment.lastUpdated);
      return shipment.status === "in_transit" && lastUpdated && lastUpdated >= dayStart && lastUpdated < dayEnd;
    }).length;

    const label = dayStart.toLocaleDateString(undefined, { weekday: "short" });
    days.push({ label, delivered, delayed, inTransit });
  }

  return days;
}

export function buildRegionPerformance(shipments: Shipment[]): RegionPerformanceEntry[] {
  const byRegion = new Map<string, Shipment[]>();

  shipments.forEach((shipment) => {
    const key = shipment.region ?? "Unknown";
    byRegion.set(key, [...(byRegion.get(key) ?? []), shipment]);
  });

  return Array.from(byRegion.entries()).map(([region, regionShipments]) => {
    const deliveries = regionShipments.filter((shipment) => shipment.status === "delivered").length;
    const delayed = regionShipments.filter((shipment) => shipment.status === "delayed").length;
    const measured = deliveries + delayed;
    const successRate = measured === 0 ? 0 : deliveries / measured;
    const averageEtaVariance = regionShipments.length
      ? getAverageEtaVariance(regionShipments)
      : 0;

    return {
      region,
      deliveries: regionShipments.length,
      successRate,
      averageEtaVarianceMinutes: averageEtaVariance,
    };
  });
}

export function buildCourierLeaderboard(couriers: Courier[]): CourierLeaderboardEntry[] {
  return couriers
    .map((courier) => ({
      courierId: courier.id,
      name: courier.name,
      avatar: courier.avatar,
      deliveries: courier.metrics.deliveriesToday,
      onTimeRate: courier.metrics.onTimeRate,
      satisfaction: courier.metrics.rating,
    }))
    .sort((a, b) => b.deliveries - a.deliveries)
    .slice(0, 10);
}
