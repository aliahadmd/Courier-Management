"use client";

import {
  Activity,
  CheckCircle2,
  Clock,
  MapPinned,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DashboardMetrics } from "@/lib/metrics";

interface OverviewMetricsProps {
  metrics: DashboardMetrics;
  lastUpdatedLabel: string;
}

const overviewTiles = [
  {
    key: "totalShipments",
    label: "Total Shipments",
    icon: Package,
    tone: "info",
  },
  {
    key: "activeCouriers",
    label: "Active Couriers",
    icon: Users,
    tone: "default",
  },
  {
    key: "deliveredShipments",
    label: "Delivered Parcels",
    icon: CheckCircle2,
    tone: "success",
  },
  {
    key: "deliverySuccessRate",
    label: "Delivery Success",
    icon: TrendingUp,
    tone: "success",
    suffix: "%",
  },
  {
    key: "averageDeliveryTimeMinutes",
    label: "Avg Delivery Time",
    icon: Clock,
    tone: "default",
    suffix: "m",
  },
  {
    key: "pendingShipments",
    label: "Pending Parcels",
    icon: Activity,
    tone: "warning",
  },
  {
    key: "delayedShipments",
    label: "Delayed",
    icon: MapPinned,
    tone: "destructive",
  },
];

function getBadgeVariant(tone: string) {
  switch (tone) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "destructive":
      return "destructive";
    case "info":
      return "info";
    default:
      return "default";
  }
}

export function OverviewMetrics({ metrics, lastUpdatedLabel }: OverviewMetricsProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overviewTiles.map(({ key, label, icon: Icon, tone, suffix }) => (
          <Card key={key} className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={getBadgeVariant(tone)}>
                    <Icon className="h-3.5 w-3.5" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Tracking signal refreshed {lastUpdatedLabel}.
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground">
                  {metrics[key as keyof DashboardMetrics]}
                  {suffix}
                </span>
                {key === "deliveredShipments" ? (
                  <Badge variant="success">Today: {metrics.deliveredToday}</Badge>
                ) : null}
                {key === "deliverySuccessRate" ? (
                  <Badge variant="success">
                    {metrics.deliveredShipments} /{" "}
                    {metrics.deliveredShipments + metrics.delayedShipments}
                  </Badge>
                ) : null}
              </div>
              {key === "pendingShipments" && (
                <CardDescription>
                  {metrics.inTransitShipments} parcels already on the road.
                </CardDescription>
              )}
              {key === "delayedShipments" && (
                <CardDescription>
                  Escalate if delay exceeds 30 minutes.
                </CardDescription>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
