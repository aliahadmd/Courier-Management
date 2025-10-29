"use client";

import { useMemo } from "react";
import { Contact, Mail, MapPin, Phone } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Customer, Shipment } from "@/lib/types";

interface CustomerOverviewProps {
  customers: Customer[];
  shipments: Shipment[];
}

export function CustomerOverview({ customers, shipments }: CustomerOverviewProps) {
  const stats = useMemo(() => {
    return customers.map((customer) => {
      const customerShipments = shipments.filter(
        (shipment) => shipment.customerId === customer.id
      );
      const active = customerShipments.filter(
        (shipment) => shipment.status === "in_transit" || shipment.status === "pending"
      ).length;
      const delivered = customerShipments.filter((shipment) => shipment.status === "delivered").length;
      return {
        customer,
        active,
        delivered,
        total: customerShipments.length,
      };
    });
  }, [customers, shipments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Contact className="h-4 w-4 text-primary" />
          Customer Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customer directory with live shipment status. Use tooltips for quick actions.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TooltipProvider>
          {stats.map(({ customer, active, delivered, total }) => (
            <div
              key={customer.id}
              className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.city} · {customer.region}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Copy email to notify about delivery changes.</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Tap for escalation or concierge delivery.</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {customer.address}
              </div>
              {customer.notes ? (
                <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                  {customer.notes}
                </p>
              ) : null}
              <div className="mt-auto flex items-center justify-between rounded-md border border-dashed border-border/60 bg-background px-3 py-2 text-xs">
                <span>{total} total shipments</span>
                <div className="flex gap-2">
                  <span className="font-medium text-foreground">{active} active</span>
                  <span className="text-muted-foreground">{delivered} delivered</span>
                </div>
              </div>
            </div>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
