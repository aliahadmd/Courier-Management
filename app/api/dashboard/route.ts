import { NextResponse } from "next/server";

import { getDashboardSnapshot } from "@/lib/db/dashboard";

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
