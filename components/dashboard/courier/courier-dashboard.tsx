"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  CircleCheck,
  CircleDashed,
  MapPinned,
  Route,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Courier, Shipment } from "@/lib/types";

interface CourierDashboardProps {
  courier: Courier;
  shipments: Shipment[];
  events: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    type: "status" | "handoff" | "alert";
  }[];
  onRefresh?: () => void | Promise<void>;
}

const statusLabels: Record<Shipment["status"], string> = {
  pending: "Awaiting pickup",
  in_transit: "On route",
  delivered: "Delivered",
  delayed: "Delayed",
};

const statusProgress: Record<Shipment["status"], number> = {
  pending: 15,
  in_transit: 60,
  delivered: 100,
  delayed: 40,
};

export function CourierDashboard({
  courier,
  shipments,
  events,
  onRefresh,
}: CourierDashboardProps) {
  const assignments = useMemo(
    () =>
      shipments
        .filter((shipment) => shipment.courierId === courier.id)
        .sort((a, b) => a.status.localeCompare(b.status)),
    [shipments, courier.id]
  );

  const activeAssignments = assignments.filter((shipment) => shipment.status !== "delivered");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateStatus = (shipmentId: string, status: Shipment["status"]) => {
    startTransition(() => {
      fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Unable to update status (${response.status})`);
          }
          return onRefresh?.();
        })
        .then(() => {
          const messages: Record<Shipment["status"], string> = {
            pending: "Shipment reset. Dispatch will confirm new pickup.",
            in_transit: "Marked as picked up. Keep the handheld updated.",
            delayed: "Delay escalated. Ops team notified.",
            delivered: "Nice work! Proof upload when available.",
          };
          setMessage(messages[status]);
        })
        .catch((error: unknown) => {
          console.error(error);
          setMessage(
            error instanceof Error ? error.message : "Could not update shipment, try again."
          );
        });
    });
  };

  const [proofKind, setProofKind] = useState<"photo" | "signature" | "document">("photo");

  const uploadProof = (shipmentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingId(shipmentId);

    const uploads = Array.from(files).map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", proofKind);
      formData.append("uploadedBy", "courier");

      return fetch(`/api/shipments/${shipmentId}/proof`, {
        method: "POST",
        body: formData,
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }
      });
    });

    Promise.allSettled(uploads)
      .then(() => onRefresh?.())
      .then(() => {
        setMessage("Proof uploaded successfully.");
      })
      .catch((error: unknown) => {
        console.error(error);
        setMessage(
          error instanceof Error ? error.message : "Unable to upload proof at the moment."
        );
      })
      .finally(() => {
        setUploadingId(null);
      });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bike className="h-4 w-4 text-primary" />
              Your vehicle & route
            </CardTitle>
            <CardDescription>
              {courier.vehicle} · {courier.region} region
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {courier.assignments.length} stops scheduled · {courier.metrics.distanceTodayKm} km
              driven today.
            </p>
            <Badge variant={courier.status === "online" ? "success" : "warning"}>
              Status: {courier.status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Service quality
            </CardTitle>
            <CardDescription>
              On-time {Math.round(courier.metrics.onTimeRate * 100)}% · Rating{" "}
              {courier.metrics.rating.toFixed(1)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={courier.metrics.onTimeRate * 100} />
            <p className="text-xs text-muted-foreground">
              Keep delays under 10 minutes. Communicate early if ETA slips.
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPinned className="h-4 w-4 text-primary" />
              Current assignment
            </CardTitle>
            <CardDescription>
              Last ping{" "}
              {new Date(courier.lastSeen).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {message ? (
              <p className="rounded-md border border-dashed border-border/70 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {message}
              </p>
            ) : null}
            <div className="text-sm text-muted-foreground">
              {activeAssignments[0]
                ? `${activeAssignments[0].destination} · ETA ${activeAssignments[0].etaMinutes} min`
                : "No pending deliveries"}
            </div>
            {activeAssignments[0] ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled={isPending}
                  onClick={() => updateStatus(activeAssignments[0].id, "in_transit")}
                >
                  Mark picked up
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  disabled={isPending}
                  onClick={() => updateStatus(activeAssignments[0].id, "delayed")}
                >
                  Flag delay
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={isPending}
                  onClick={() => updateStatus(activeAssignments[0].id, "delivered")}
                >
                  Complete stop
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Route className="h-4 w-4 text-primary" />
            Today's manifest
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Update each stop as you go. Tooltips explain expectations per status.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TooltipProvider>
            {assignments.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {shipment.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tracking {shipment.trackingId} · {shipment.serviceLevel.replace("_", " ")}
                    </p>
                  </div>
                  <Badge variant="info" className="w-fit">
                    ETA {shipment.etaMinutes} minutes
                  </Badge>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Status
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={
                            shipment.status === "delayed"
                              ? "destructive"
                              : shipment.status === "delivered"
                              ? "success"
                              : "info"
                          }
                          className="w-fit"
                        >
                          {statusLabels[shipment.status]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {shipment.status === "delayed"
                          ? "Notify dispatch if delay exceeds 15 minutes."
                          : "Use handheld device to push live updates."}
                      </TooltipContent>
                    </Tooltip>
                    <Progress value={statusProgress[shipment.status]} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Timeline
                    </p>
                    <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      {shipment.timeline.slice(-3).map((entry, index) => (
                        <li key={`${entry.status}-${index}`} className="flex items-center gap-2">
                          <CircleDashed className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">{entry.status}</span>
                          <span>
                            {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Checklist
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CircleCheck className="h-3 w-3 text-success" />
                        Verify recipient name
                      </li>
                      <li className="flex items-center gap-2">
                        <CircleCheck className="h-3 w-3 text-success" />
                        Capture proof of delivery
                      </li>
                      <li className="flex items-center gap-2">
                        <CircleCheck className="h-3 w-3 text-success" />
                        Update status in mobile app
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => updateStatus(shipment.id, "in_transit")}
                  >
                    Mark picked up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => updateStatus(shipment.id, "delayed")}
                  >
                    Delay
                  </Button>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => updateStatus(shipment.id, "delivered")}
                  >
                    Delivered
                  </Button>
                  <label className="text-xs text-muted-foreground">
                    Proof type
                    <select
                      value={proofKind}
                      onChange={(event) =>
                        setProofKind(event.target.value as "photo" | "signature" | "document")
                      }
                      className="mt-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="photo">Photo</option>
                      <option value="signature">Signature</option>
                      <option value="document">Document</option>
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Upload files
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      className="mt-1 block w-full text-xs"
                      onChange={(event) => {
                        uploadProof(shipment.id, event.target.files);
                        event.target.value = "";
                      }}
                      disabled={uploadingId === shipment.id}
                    />
                  </label>
                  {uploadingId === shipment.id && (
                    <span className="text-xs text-muted-foreground">Uploading…</span>
                  )}
                </div>
                {shipment.proofs && shipment.proofs.length > 0 ? (
                  <div className="mt-3 space-y-2 rounded-md border border-dashed border-border/70 bg-background/60 p-3 text-xs text-muted-foreground">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Proof assets
                    </p>
                    {shipment.proofs.map((proof) => (
                      <div key={proof.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Badge variant={proof.kind === "signature" ? "warning" : "info"}>
                            {proof.kind}
                          </Badge>
                          {new Date(proof.uploadedAt).toLocaleString()}
                        </span>
                        <span className="truncate text-muted-foreground/80">{proof.assetKey}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </TooltipProvider>
          {assignments.length === 0 && (
            <p className="text-sm text-muted-foreground">No assignments for this courier yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Operations feed
          </CardTitle>
          <CardDescription>Stay aligned with dispatch announcements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground"
            >
              <p className="text-sm font-semibold text-foreground">{event.title}</p>
              <p>{event.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide">
                {new Date(event.timestamp).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
