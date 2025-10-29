"use client";

import { useState, useTransition } from "react";
import { CalendarClock, MapPinned, Package, PhoneCall } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Customer, Shipment } from "@/lib/types";

interface CustomerDashboardProps {
  customer: Customer;
  shipments: Shipment[];
  supportLine: string;
  onRefresh?: () => void | Promise<void>;
}

const statusBadgeVariant: Record<Shipment["status"], "warning" | "info" | "success" | "destructive"> = {
  pending: "warning",
  in_transit: "info",
  delivered: "success",
  delayed: "destructive",
};

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerDashboard({
  customer,
  shipments,
  supportLine,
  onRefresh,
}: CustomerDashboardProps) {
  const [activeShipmentId, setActiveShipmentId] = useState(
    shipments.find((shipment) => shipment.status !== "delivered")?.id ?? shipments[0]?.id ?? ""
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeShipment = shipments.find((shipment) => shipment.id === activeShipmentId);

  const confirmDelivered = (shipmentId: string) => {
    startTransition(() => {
      fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Unable to confirm delivery (${response.status})`);
          }
          return onRefresh?.();
        })
        .then(() => {
          setMessage("Thanks! Delivery confirmed and courier notified.");
        })
        .catch((error: unknown) => {
          console.error(error);
          setMessage(
            error instanceof Error ? error.message : "Could not confirm delivery right now."
          );
        });
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-1 text-base font-semibold text-foreground md:flex-row md:items-center md:justify-between">
            <span>Hello {customer.name.split(" ")[0]}, here's your parcel hub</span>
            <Badge variant="info">Customer ID · {customer.id.toUpperCase()}</Badge>
          </CardTitle>
          <CardDescription>
            Track deliveries, review history, and get updates in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-dashed border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Primary address
            </p>
            <p className="text-sm font-semibold text-foreground">{customer.address}</p>
            <p className="text-xs text-muted-foreground">
              {customer.city}, {customer.region}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-md border border-dashed border-border/60 bg-card/60 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Delivery preferences
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.notes ?? "No special instructions on file."}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Need to change preferences? Share them with the support team below.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="rounded-md border border-dashed border-border/60 bg-card/60 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Need help?
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <PhoneCall className="h-4 w-4 text-primary" />
              {supportLine}
            </p>
            <p className="text-xs text-muted-foreground">
              Available 7 days, 7:00 AM – 9:00 PM local time.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Package className="h-4 w-4 text-primary" />
            Shipments overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Switch between active, delivered, or delayed parcels.
          </p>
        </CardHeader>
        <CardContent>
          {message ? (
            <p className="mb-3 rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {message}
            </p>
          ) : null}
          <Tabs
            value={activeShipmentId}
            onValueChange={(value) => setActiveShipmentId(value)}
            className="space-y-4"
          >
            <TabsList className="flex w-full flex-wrap gap-2 bg-transparent p-0">
              {shipments.map((shipment) => (
                <TabsTrigger
                  key={shipment.id}
                  value={shipment.id}
                  className="flex h-auto flex-col gap-1 rounded-md border border-border/70 bg-card px-3 py-2 text-left data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {shipment.trackingId}
                  </span>
                  <span className="text-sm text-foreground">{shipment.destination}</span>
                  <Badge variant={statusBadgeVariant[shipment.status]} className="w-fit">
                    {shipment.status.replace("_", " ")}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {activeShipment ? (
              <TabsContent value={activeShipment.id}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-background p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Current status
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={statusBadgeVariant[activeShipment.status]}>
                        {activeShipment.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ETA {activeShipment.etaMinutes} minutes
                      </span>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Picked up:</strong>{" "}
                        {formatDateTime(activeShipment.pickedUpAt)}
                      </p>
                      <p>
                        <strong className="text-foreground">Last update:</strong>{" "}
                        {formatDateTime(activeShipment.lastUpdated)}
                      </p>
                      <p>
                        <strong className="text-foreground">Service:</strong>{" "}
                        {activeShipment.serviceLevel.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Route overview
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {activeShipment.route.map((point, index) => (
                        <div key={`${point.lat}-${point.lng}-${index}`} className="flex items-center gap-2">
                          <MapPinned className="h-3.5 w-3.5 text-primary" />
                          <span>{point.label ?? "Waypoint"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-card/50 p-4 shadow-sm">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                    <CalendarClock className="h-3.5 w-3.5 text-primary" />
                    Timeline
                  </p>
                  <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {activeShipment.timeline.map((entry, index) => (
                      <li key={`${entry.status}-${index}`} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="font-semibold text-foreground">
                          {entry.status}
                        </span>
                        <span>{formatDateTime(entry.timestamp)}</span>
                        {entry.note ? <span>· {entry.note}</span> : null}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <a href={`/receipt/${activeShipment.trackingId}`} target="_blank" rel="noreferrer">
                      View delivery receipt
                    </a>
                  </Button>
                </div>
                {activeShipment.status !== "delivered" ? (
                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => confirmDelivered(activeShipment.id)}
                    >
                      Confirm delivery
                    </Button>
                  </div>
                ) : null}
              </TabsContent>
            ) : (
              <p className="text-sm text-muted-foreground">Select a shipment to view details.</p>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
