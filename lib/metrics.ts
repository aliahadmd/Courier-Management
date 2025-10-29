import { type Courier, type Shipment } from "./types";

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
