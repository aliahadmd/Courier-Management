import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createShipment,
  ensureCustomer,
  type CreateShipmentInput,
} from "@/lib/db/mutations";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<{
    trackingId: string;
    orderNumber?: string;
    customerId?: string;
    customer?: Record<string, unknown>;
    courierId?: string;
    status?: string;
    serviceLevel?: string;
    region?: string;
    origin?: string;
    destination?: string;
    etaMinutes?: number;
    weightKg?: number;
    pickupScheduledAt?: string;
    slaPolicyId?: string;
    autoAssign?: boolean;
  }>;

  if (!payload || typeof payload.trackingId !== "string" || !payload.trackingId.trim()) {
    return NextResponse.json({ error: "trackingId is required" }, { status: 400 });
  }

  if (!payload.region || !payload.origin || !payload.destination) {
    return NextResponse.json({ error: "region, origin, and destination are required" }, { status: 400 });
  }

  const serviceLevelValue = (payload.serviceLevel ?? "standard")
    .toString()
    .toLowerCase();

  if (!["same_day", "next_day", "standard"].includes(serviceLevelValue)) {
    return NextResponse.json({ error: "Invalid serviceLevel" }, { status: 400 });
  }

  const serviceLevel = serviceLevelValue as "same_day" | "next_day" | "standard";

  let customerId: string | undefined = payload.customerId;

  if (!customerId) {
    if (!payload.customer || typeof payload.customer.name !== "string") {
      return NextResponse.json({ error: "Customer details are required" }, { status: 400 });
    }

    const customerPayload = payload.customer as Record<string, unknown>;

    customerId = await ensureCustomer({
      name: customerPayload.name as string,
      email: typeof customerPayload.email === "string" ? customerPayload.email : undefined,
      phone: typeof customerPayload.phone === "string" ? customerPayload.phone : undefined,
      address: typeof customerPayload.address === "string" ? customerPayload.address : undefined,
      city: typeof customerPayload.city === "string" ? customerPayload.city : undefined,
      region:
        typeof customerPayload.region === "string"
          ? customerPayload.region
          : payload.region,
      notes: typeof customerPayload.notes === "string" ? customerPayload.notes : undefined,
    });
  }

  const allowedStatuses = ["pending", "in_transit", "delayed", "delivered"];
  const statusValue =
    typeof payload.status === "string" && allowedStatuses.includes(payload.status)
      ? (payload.status as "pending" | "in_transit" | "delayed" | "delivered")
      : "pending";

  const input: CreateShipmentInput = {
    trackingId: payload.trackingId,
    orderNumber: typeof payload.orderNumber === "string" ? payload.orderNumber : undefined,
    customerId,
    courierId:
      typeof payload.courierId === "string" && payload.courierId.length > 0
        ? payload.courierId
        : null,
    status: statusValue,
    serviceLevel,
    region: payload.region,
    origin: payload.origin,
    destination: payload.destination,
    etaMinutes: typeof payload.etaMinutes === "number" ? payload.etaMinutes : undefined,
    weightKg: typeof payload.weightKg === "number" ? payload.weightKg : undefined,
    pickupScheduledAt:
      typeof payload.pickupScheduledAt === "string" ? payload.pickupScheduledAt : undefined,
    slaPolicyId:
      typeof payload.slaPolicyId === "string" && payload.slaPolicyId.length > 0
        ? payload.slaPolicyId
        : undefined,
  };

  const result = await createShipment(input, { autoAssign: payload.autoAssign ?? false });

  return NextResponse.json(
    {
      shipmentId: result.id,
      courierId: result.courierId,
      slaPolicyId: result.slaPolicyId,
    },
    { status: 201 }
  );
}
