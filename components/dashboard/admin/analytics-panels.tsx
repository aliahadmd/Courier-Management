"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Download, LineChart, Medal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  CourierLeaderboardEntry,
  PerformanceSummary,
  TrendPoint,
} from "@/lib/types";

interface AnalyticsPanelsProps {
  performance: PerformanceSummary[];
  trend: TrendPoint[];
  leaderboard: CourierLeaderboardEntry[];
  regionPerformance: {
    region: string;
    deliveries: number;
    successRate: number;
    averageEtaVarianceMinutes: number;
  }[];
}

function DeliveryTrendChart({ data }: { data: TrendPoint[] }) {
  const maxValue = useMemo(
    () =>
      Math.max(
        ...data.map((point) => point.delivered + point.inTransit),
        1
      ),
    [data]
  );

  const buildPoints = (key: keyof TrendPoint) =>
    data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * 100;
        const value = point[key] as number;
        const y = 100 - (value / maxValue) * 100;
        return `${x},${y}`;
      })
      .join(" ");

  const deliveredPoints = buildPoints("delivered");
  const delayedPoints = buildPoints("delayed");

  return (
    <div className="space-y-4">
      <div className="relative h-48 w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-primary/80"
        >
          <defs>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.3)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
            </linearGradient>
          </defs>
          <polyline
            points={deliveredPoints}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
          <polygon
            points={`${deliveredPoints} 100,100 0,100`}
            fill="url(#trendFill)"
            opacity={0.6}
          />
          <polyline
            points={delayedPoints}
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
        </svg>
        <div className="absolute inset-0 grid grid-cols-7 text-xs text-muted-foreground">
          {data.map((point) => (
            <div
              key={point.label}
              className="flex flex-col items-center justify-end pb-2"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                      {point.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>Delivered: {point.delivered}</p>
                      <p>Delayed: {point.delayed}</p>
                      <p>In transit: {point.inTransit}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-4 rounded-full bg-primary" />
          Delivered trend
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-4 rounded-full border border-dashed border-destructive" />
          Delayed exceptions
        </span>
      </div>
    </div>
  );
}

export function AnalyticsPanels({
  performance,
  trend,
  leaderboard,
  regionPerformance,
}: AnalyticsPanelsProps) {
  const [activePeriod, setActivePeriod] = useState<PerformanceSummary["period"]>("today");

  const currentSummary = performance.find((item) => item.period === activePeriod)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <LineChart className="h-4 w-4 text-primary" />
              Network Analytics
            </CardTitle>
            <CardDescription>
              Operational performance across periods. Switch views to compare pacing.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export snapshot
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activePeriod} onValueChange={(value) => setActivePeriod(value as PerformanceSummary["period"])}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This week</TabsTrigger>
              <TabsTrigger value="month">This month</TabsTrigger>
            </TabsList>
            <TabsContent value={activePeriod}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                    <CardDescription>Total completed during the selected window.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-semibold text-foreground">
                      {currentSummary.deliveries}
                    </p>
                    <Badge variant="success">
                      On time {Math.round(currentSummary.onTimeRate * 100)}%
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Delayed</CardTitle>
                    <CardDescription>Shipments exceeding SLA.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-semibold text-foreground">{currentSummary.delayed}</p>
                    <Badge variant="warning">
                      Avg variance {currentSummary.averageEtaVarianceMinutes} min
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Distance</CardTitle>
                    <CardDescription>Cumulative kilometres across the fleet.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-semibold text-foreground">
                      {currentSummary.kmTravelled.toLocaleString()} km
                    </p>
                    <Badge variant="info">
                      Carbon {currentSummary.carbonEstimateKg.toLocaleString()} kg
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Focus</CardTitle>
                    <CardDescription>
                      Prioritise recovering late parcels or high-value orders.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>Escalate: 2 temperature-sensitive parcels in transit.</p>
                    <p>Watch list: Midtown and Downtown capacity this evening.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          <DeliveryTrendChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Medal className="h-4 w-4 text-primary" />
            Courier Leaderboard
          </CardTitle>
          <CardDescription>Success rate and satisfaction rolling past 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <ScrollArea className="h-60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Courier</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>On-time</TableHead>
                  <TableHead className="text-right">Satisfaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow key={entry.courierId}>
                    <TableCell className="font-medium text-foreground">
                      {entry.name}
                    </TableCell>
                    <TableCell>{entry.deliveries}</TableCell>
                    <TableCell>{Math.round(entry.onTimeRate * 100)}%</TableCell>
                    <TableCell className="text-right">{entry.satisfaction.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Regional Highlights
          </CardTitle>
          <CardDescription>Identify hotspots and proactively rebalance your fleet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {regionPerformance.map((region) => (
            <div
              key={region.region}
              className="flex flex-col gap-2 rounded-md border border-border/70 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{region.region}</p>
                <Badge variant="info">{region.deliveries} deliveries</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>Success {Math.round(region.successRate * 100)}%</p>
                <p>ETA variance {region.averageEtaVarianceMinutes} min</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
