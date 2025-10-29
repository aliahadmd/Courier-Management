"use client";

import { useMemo, useState } from "react";
import { LayoutDashboard, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { ShipmentsTable } from "@/components/dashboard/admin/shipments-table";
import { NetworkMap } from "@/components/dashboard/admin/network-map";
import { CourierPerformance } from "@/components/dashboard/admin/courier-performance";
import { AnalyticsPanels } from "@/components/dashboard/admin/analytics-panels";
import { ActivityTimeline } from "@/components/dashboard/admin/activity-timeline";
import { CustomerOverview } from "@/components/dashboard/admin/customer-overview";
import type {
  Courier,
  Customer,
  CourierLeaderboardEntry,
  PerformanceSummary,
  Role,
  Shipment,
  TrendPoint,
} from "@/lib/types";
import type { DashboardMetrics } from "@/lib/metrics";

interface AdminDashboardProps {
  shipments: Shipment[];
  couriers: Courier[];
  customers: Customer[];
  metrics: DashboardMetrics;
  performance: PerformanceSummary[];
  trend: TrendPoint[];
  leaderboard: CourierLeaderboardEntry[];
  regionPerformance: {
    region: string;
    deliveries: number;
    successRate: number;
    averageEtaVarianceMinutes: number;
  }[];
  events: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    type: "status" | "handoff" | "alert";
  }[];
  lastUpdatedLabel: string;
  role: Role;
}

export function AdminDashboard({
  shipments,
  couriers,
  customers,
  metrics,
  performance,
  trend,
  leaderboard,
  regionPerformance,
  events,
  lastUpdatedLabel,
  role,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const delayedShipments = useMemo(
    () => shipments.filter((shipment) => shipment.status === "delayed"),
    [shipments]
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Courier Network Control</h1>
            <p className="text-sm text-muted-foreground">
              Real-time overview to coordinate routes, resolve delays, and support couriers.
            </p>
          </div>
        </div>
        <Card className="border border-border/70 bg-card/60 shadow-sm md:w-72">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Escalation snapshot
            </CardTitle>
            <CardDescription>Keep an eye on at-risk deliveries.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              {delayedShipments.length} delayed parcels
            </span>
            <span>{metrics.activeCouriers} active couriers</span>
          </CardContent>
        </Card>
      </div>

      <TabsList className="flex w-full flex-wrap gap-2 bg-muted/30 p-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="shipments">Shipments</TabsTrigger>
        <TabsTrigger value="couriers">Couriers</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <OverviewMetrics metrics={metrics} lastUpdatedLabel={lastUpdatedLabel} />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <NetworkMap couriers={couriers} shipments={shipments} />
          <ActivityTimeline events={events} role={role} />
        </div>
      </TabsContent>

      <TabsContent value="shipments">
        <ShipmentsTable shipments={shipments} couriers={couriers} customers={customers} />
      </TabsContent>

      <TabsContent value="couriers">
        <CourierPerformance couriers={couriers} />
      </TabsContent>

      <TabsContent value="customers">
        <CustomerOverview customers={customers} shipments={shipments} />
      </TabsContent>

      <TabsContent value="analytics">
        <AnalyticsPanels
          performance={performance}
          trend={trend}
          leaderboard={leaderboard}
          regionPerformance={regionPerformance}
        />
      </TabsContent>
    </Tabs>
  );
}
