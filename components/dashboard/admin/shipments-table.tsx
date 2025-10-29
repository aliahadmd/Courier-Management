"use client";

import { useMemo, useState } from "react";
import { Search, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Courier, Customer, Shipment } from "@/lib/types";

type StatusFilter = "all" | Shipment["status"];

interface ShipmentsTableProps {
  shipments: Shipment[];
  couriers: Courier[];
  customers: Customer[];
}

const statusBadgeVariant: Record<Shipment["status"], "info" | "warning" | "success" | "destructive"> = {
  pending: "warning",
  in_transit: "info",
  delivered: "success",
  delayed: "destructive",
};

const statusCopy: Record<Shipment["status"], string> = {
  pending: "Pending",
  in_transit: "In Transit",
  delivered: "Delivered",
  delayed: "Delayed",
};

export function ShipmentsTable({ shipments, couriers, customers }: ShipmentsTableProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [region, setRegion] = useState<string>("all");
  const [courierId, setCourierId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const matchesStatus = status === "all" || shipment.status === status;
      const matchesRegion = region === "all" || shipment.region === region;
      const matchesCourier = courierId === "all" || shipment.courierId === courierId;

      if (!matchesStatus || !matchesRegion || !matchesCourier) {
        return false;
      }

      if (!search.trim()) return true;
      const query = search.trim().toLowerCase();
      return (
        shipment.trackingId.toLowerCase().includes(query) ||
        shipment.orderNumber.toLowerCase().includes(query) ||
        shipment.destination.toLowerCase().includes(query)
      );
    });
  }, [shipments, status, region, courierId, search]);

  const uniqueRegions = Array.from(new Set(shipments.map((shipment) => shipment.region)));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Truck className="h-4 w-4 text-primary" />
            Shipments Control
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor parcel flow, reassign couriers, or escalate exceptions.
          </p>
        </div>
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as StatusFilter)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Status · All</option>
                  <option value="pending">Pending</option>
                  <option value="in_transit">In transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                </select>
              </TooltipTrigger>
              <TooltipContent>Filter shipments by current lifecycle state.</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Region · All</option>
                  {uniqueRegions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent>Focus on a specific operating region.</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={courierId}
                  onChange={(event) => setCourierId(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Courier · All</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name}
                    </option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent>Review workload per courier.</TooltipContent>
            </Tooltip>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tracking, order, or destination"
                className="pl-8"
              />
            </div>
          </div>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead>Tracking</TableHead>
              <TableHead>Status · SLA</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Last Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.map((shipment) => {
              const courier = couriers.find((item) => item.id === shipment.courierId);
              const customer = customers.find((item) => item.id === shipment.customerId);

              return (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{shipment.trackingId}</span>
                      <span className="text-xs text-muted-foreground">
                        Order {shipment.orderNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={statusBadgeVariant[shipment.status]}>
                        {statusCopy[shipment.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ETA {shipment.etaMinutes} min · {shipment.serviceLevel.replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {courier?.name ?? "Unassigned"}
                      </span>
                      <span className="text-xs text-muted-foreground">{shipment.region}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {customer?.name ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {customer?.city ?? shipment.destination}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{shipment.origin}</span>
                      <span className="text-xs text-muted-foreground">
                        ↳ {shipment.destination}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(shipment.lastUpdated).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredShipments.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No shipments match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
