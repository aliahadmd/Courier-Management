"use client";

import { useMemo } from "react";
import { Activity, MapPinned, Package, Wifi } from "lucide-react";

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

export function NetworkMap({ couriers, shipments }: NetworkMapProps) {
  const courierSummaries = useMemo(() => {
    return couriers.map((courier) => {
      const assigned = shipments.filter((shipment) => shipment.courierId === courier.id);
      const delayed = assigned.filter((shipment) => shipment.status === "delayed");
      const inTransit = assigned.filter((shipment) => shipment.status === "in_transit");

      return {
        courier,
        assigned,
        delayed,
        inTransit,
      };
    });
  }, [couriers, shipments]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MapPinned className="h-4 w-4 text-primary" />
            Fleet pulse
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Snapshot of courier load, service health, and potential exceptions.
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <Wifi className="h-3.5 w-3.5" />
          Live
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          {courierSummaries.map(({ courier, assigned, delayed, inTransit }) => (
            <div
              key={courier.id}
              className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{courier.name}</p>
                  <p className="text-xs text-muted-foreground">{courier.vehicle}</p>
                </div>
                <Badge variant={statusTone[courier.status]}>
                  {courier.status === "online" ? "On route" : courier.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {assigned.length} assigned
                </span>
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  {inTransit.length} in transit · {delayed.length} delayed
                </span>
                <span className="inline-flex items-center gap-1">
                  On-time {Math.round(courier.metrics.onTimeRate * 100)}% · Last ping{" "}
                  {courier.lastSeen
                    ? new Date(courier.lastSeen).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>

              {assigned.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assigned.slice(0, 4).map((shipment) => (
                    <Tooltip key={shipment.id}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground">
                          {shipment.trackingId}
                          <Badge
                            variant={
                              shipment.status === "delayed"
                                ? "destructive"
                                : shipment.status === "in_transit"
                                ? "info"
                                : shipment.status === "pending"
                                ? "warning"
                                : "success"
                            }
                            className="px-2 py-0"
                          >
                            {shipment.status.replace("_", " ")}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="w-64 text-left">
                        <p className="text-xs font-semibold text-foreground">
                          {shipment.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ETA {shipment.etaMinutes} min · Service {shipment.serviceLevel}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Last update{" "}
                          {new Date(shipment.lastUpdated).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {assigned.length > 4 ? (
                    <span className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">
                      +{assigned.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No parcels allocated.</p>
              )}
            </div>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
