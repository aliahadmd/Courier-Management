"use client";

import { Fragment } from "react";
import { AlertCircle, Clock3, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/lib/types";

interface ActivityTimelineProps {
  events: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    type: "status" | "handoff" | "alert";
  }[];
  role: Role;
}

const markerTone: Record<ActivityTimelineProps["events"][number]["type"], string> = {
  status: "bg-primary",
  handoff: "bg-info",
  alert: "bg-destructive",
};

export function ActivityTimeline({ events, role }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <RefreshCcw className="h-4 w-4 text-primary" />
            {role === "admin" ? "Operations Feed" : "Latest Updates"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {role === "admin"
              ? "Live feed of exceptions and escalations in the network."
              : "Keep an eye on handovers, delays, and customer notifications."}
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Clock3 className="h-3 w-3" />
          {events.length} events
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <Fragment key={event.id}>
              <div className="relative pl-6">
                <span
                  className={`absolute left-0 top-1 flex h-2.5 w-2.5 -translate-x-1/2 rounded-full ${markerTone[event.type]}`}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{event.title}</span>
                  <span>•</span>
                  <span>
                    {new Date(event.timestamp).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.type === "alert" && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Action required
                  </span>
                )}
              </div>
              {index < events.length - 1 && (
                <div className="ml-1 h-6 border-l border-dashed border-border/70" />
              )}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
