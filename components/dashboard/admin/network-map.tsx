"use client";

import { useMemo } from "react";
import { MapPinned, Wifi } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Courier, Shipment } from "@/lib/types";

interface NetworkMapProps {
  couriers: Courier[];
  shipments: Shipment[];
}

const statusTone: Record<Courier["status"], "success" | "warning" | "destructive" | "info"> = {
  online: "success",
  break: "warning",
  offline: "destructive",
};

function normalize(value: number, min: number, max: number) {
  if (max - min === 0) return 0.5;
  return (value - min) / (max - min);
}

export function NetworkMap({ couriers, shipments }: NetworkMapProps) {
  const bounds = useMemo(() => {
    const lats = couriers.map((courier) => courier.location.lat);
    const lngs = couriers.map((courier) => courier.location.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [couriers]);

  const courierAlerts = useMemo(() => {
    const delayedShipments = shipments.filter((shipment) => shipment.status === "delayed");
    return delayedShipments.map((shipment) => shipment.courierId);
  }, [shipments]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPinned className="h-4 w-4 text-primary" />
            Live Courier Network
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Approximate courier positions with health signals.
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <Wifi className="h-3.5 w-3.5" />
          Syncing
        </Badge>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="relative h-64 overflow-hidden rounded-lg border border-dashed border-border bg-gradient-to-br from-muted/30 via-muted/5 to-muted p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px,_#dfe4ea_1px,_transparent_0)] bg-[length:26px_26px] opacity-50 dark:bg-[radial-gradient(circle_at_1px,_rgba(255,255,255,0.12)_1px,_transparent_0)]" />
            <div className="absolute inset-0">
              {couriers.map((courier) => {
                const top =
                  (1 - normalize(courier.location.lat, bounds.minLat, bounds.maxLat)) * 100;
                const left =
                  normalize(courier.location.lng, bounds.minLng, bounds.maxLng) * 100;
                const hasAlert = courierAlerts.includes(courier.id);

                return (
                  <Tooltip key={courier.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus-visible:outline-none"
                        style={{ top: `${top}%`, left: `${left}%` }}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground group-hover:text-foreground">
                          {courier.name.split(" ")[0]}
                        </span>
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold shadow-sm transition group-hover:border-primary group-hover:text-primary"
                          aria-label={`${courier.name} status ${courier.status}`}
                        >
                          {courier.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <Badge variant={statusTone[courier.status]} className="px-1 py-0">
                            {courier.status === "online" ? "On route" : courier.status}
                          </Badge>
                          {hasAlert ? (
                            <span className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                          ) : null}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="w-56 text-left">
                      <p className="text-xs font-semibold text-foreground">
                        {courier.name} · {courier.vehicle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {courier.assignments.length} active stops · {courier.metrics.distanceTodayKm}
                        km today
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        On-time rate {Math.round(courier.metrics.onTimeRate * 100)}% · Last ping{" "}
                        {new Date(courier.lastSeen).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
