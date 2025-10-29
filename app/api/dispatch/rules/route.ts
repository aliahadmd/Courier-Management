import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createDispatchRule } from "@/lib/db/mutations";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<{
    region: string | null;
    vehicleType: string | null;
    maxActiveShipments: number;
    enableAutoAssign: boolean;
    priority: number;
  }>;

  const rule = await createDispatchRule({
    region: payload.region ?? null,
    vehicleType: payload.vehicleType ?? null,
    maxActiveShipments:
      typeof payload.maxActiveShipments === "number" ? payload.maxActiveShipments : undefined,
    enableAutoAssign:
      typeof payload.enableAutoAssign === "boolean" ? payload.enableAutoAssign : undefined,
    priority: typeof payload.priority === "number" ? payload.priority : undefined,
  });

  return NextResponse.json(rule, { status: 201 });
}
