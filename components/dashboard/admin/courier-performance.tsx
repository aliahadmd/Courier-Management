"use client";

import { Gauge, Phone, Route } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Courier } from "@/lib/types";

interface CourierPerformanceProps {
  couriers: Courier[];
}

export function CourierPerformance({ couriers }: CourierPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Gauge className="h-4 w-4 text-primary" />
          Courier Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track utilisation, on-time score, and satisfaction per courier.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider delayDuration={200}>
          {couriers.map((courier) => (
            <div
              key={courier.id}
              className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {courier.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{courier.name}</p>
                  <p className="text-xs text-muted-foreground">{courier.vehicle}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="success">
                      {courier.metrics.deliveriesToday} deliveries today
                    </Badge>
                    <Badge variant={courier.status === "online" ? "info" : "warning"}>
                      {courier.status === "online" ? "Available" : courier.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-md border border-dashed border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">On-time rate</p>
                      <p className="text-sm font-semibold text-foreground">
                        {Math.round(courier.metrics.onTimeRate * 100)}%
                      </p>
                      <Progress value={courier.metrics.onTimeRate * 100} className="mt-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Percent of tasks delivered within promised SLA.</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-md border border-dashed border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Distance today</p>
                      <p className="text-sm font-semibold text-foreground">
                        {courier.metrics.distanceTodayKm} km
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg speed {courier.speedKmh} km/h
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Helps flag overutilisation and allows balancing workloads.
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-md border border-dashed border-border/70 p-3">
                      <p className="text-xs text-muted-foreground">Customer rating</p>
                      <p className="text-sm font-semibold text-foreground">
                        {courier.metrics.rating.toFixed(1)} / 5
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ETA variance {courier.metrics.averageEtaVarianceMinutes} min
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Based on post-delivery feedback the last 30 days.</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  {courier.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Route className="h-3.5 w-3.5" />
                  {courier.assignments.length} active stops
                </div>
              </div>
            </div>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
