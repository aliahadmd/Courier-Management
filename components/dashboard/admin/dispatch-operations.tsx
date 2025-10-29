"use client";

import { useState, useTransition } from "react";
import { FileUp, Inbox, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Courier, DispatchRule, SLAPolicy } from "@/lib/types";

interface DispatchOperationsPanelProps {
  slaPolicies: SLAPolicy[];
  dispatchRules: DispatchRule[];
  couriers: Courier[];
  onRefresh?: () => void | Promise<void>;
}

function formatRegion(region?: string | null) {
  if (!region) return "All regions";
  return region;
}

export function DispatchOperationsPanel({
  slaPolicies,
  dispatchRules,
  couriers,
  onRefresh,
}: DispatchOperationsPanelProps) {
  const [createState, setCreateState] = useState({
    trackingId: "",
    destination: "",
    origin: "",
    region: "",
    serviceLevel: "same_day",
    autoAssign: true,
  });
  const [isCreating, startCreate] = useTransition();

  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [isImporting, startImport] = useTransition();

  const [newSla, setNewSla] = useState({
    name: "",
    region: "",
    serviceLevel: "standard",
    targetMinutes: 1440,
    cutoffHour: 17,
  });
  const [isSavingSla, startSaveSla] = useTransition();

  const [newRule, setNewRule] = useState({
    region: "",
    vehicleType: couriers[0]?.vehicle ?? "",
    maxActive: 10,
    enableAutoAssign: true,
    priority: 5,
  });
  const [isSavingRule, startSaveRule] = useTransition();

  const handleCreateShipment = () => {
    if (!createState.trackingId || !createState.destination || !createState.region) {
      setBulkStatus("Provide tracking, region, and destination for new shipment.");
      return;
    }

    startCreate(async () => {
      const response = await fetch("/api/shipments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: createState.trackingId,
          region: createState.region,
          origin: createState.origin || `Hub (${createState.region})`,
          destination: createState.destination,
          serviceLevel: createState.serviceLevel,
          autoAssign: createState.autoAssign,
          customer: {
            name: "Walk-up Customer",
            region: createState.region,
          },
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        setBulkStatus(`Create failed: ${(data.error as string) ?? response.statusText}`);
        return;
      }

      setCreateState((prev) => ({ ...prev, trackingId: "", destination: "" }));
      setBulkStatus("Shipment created successfully.");
      await onRefresh?.();
    });
  };

  const handleBulkImport = (file: File | null) => {
    if (!file) return;

    startImport(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("autoAssign", "true");

      const response = await fetch("/api/shipments/bulk", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setBulkStatus(`Import failed: ${(data.error as string) ?? response.statusText}`);
        return;
      }

      const processed = Number(data.processed ?? 0);
      const failed = Number(data.failed ?? 0);
      setBulkStatus(`Bulk import processed=${processed} failed=${failed}. Job ${data.jobId ?? "n/a"}.`);
      await onRefresh?.();
    });
  };

  const handleCreateSla = () => {
    if (!newSla.name.trim()) return;

    startSaveSla(async () => {
      const response = await fetch("/api/dispatch/sla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSla.name,
          region: newSla.region || null,
          serviceLevel: newSla.serviceLevel,
          targetMinutes: newSla.targetMinutes,
          cutoffHour: newSla.cutoffHour,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        setBulkStatus(`SLA save failed: ${(data.error as string) ?? response.statusText}`);
        return;
      }

      setNewSla({ name: "", region: "", serviceLevel: "standard", targetMinutes: 1440, cutoffHour: 17 });
      await onRefresh?.();
    });
  };

  const handleCreateRule = () => {
    startSaveRule(async () => {
      const response = await fetch("/api/dispatch/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: newRule.region || null,
          vehicleType: newRule.vehicleType || null,
          maxActiveShipments: newRule.maxActive,
          enableAutoAssign: newRule.enableAutoAssign,
          priority: newRule.priority,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        setBulkStatus(`Rule create failed: ${(data.error as string) ?? response.statusText}`);
        return;
      }

      await onRefresh?.();
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4 text-primary" />
            Create shipment wizard
          </CardTitle>
          <CardDescription>
            Rapidly inject test parcels with optional auto-assignment powered by dispatch rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="trackingId">Tracking ID</Label>
            <Input
              id="trackingId"
              value={createState.trackingId}
              onChange={(event) => setCreateState((prev) => ({ ...prev, trackingId: event.target.value }))}
              placeholder="e.g. DEMO-123456"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={createState.destination}
              onChange={(event) => setCreateState((prev) => ({ ...prev, destination: event.target.value }))}
              placeholder="Customer address"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="origin">Origin hub</Label>
            <Input
              id="origin"
              value={createState.origin}
              onChange={(event) => setCreateState((prev) => ({ ...prev, origin: event.target.value }))}
              placeholder="Fulfilment center"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={createState.region}
              onChange={(event) => setCreateState((prev) => ({ ...prev, region: event.target.value }))}
              placeholder="Central, East, West..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="serviceLevel">Service level</Label>
            <select
              id="serviceLevel"
              value={createState.serviceLevel}
              onChange={(event) => setCreateState((prev) => ({ ...prev, serviceLevel: event.target.value }))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="same_day">Same day</option>
              <option value="next_day">Next day</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={createState.autoAssign}
              onChange={(event) =>
                setCreateState((prev) => ({ ...prev, autoAssign: event.target.checked }))
              }
            />
            Auto-assign courier using dispatch rules
          </label>
          <Button onClick={handleCreateShipment} disabled={isCreating} className="w-full">
            Create shipment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-4 w-4 text-primary" />
            Bulk import (CSV)
          </CardTitle>
          <CardDescription>
            Upload a CSV with shipment rows. Headers supported: tracking_id, destination, region,
            service_level, customer_name, address...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept=".csv"
            onChange={(event) => handleBulkImport(event.target.files?.[0] ?? null)}
            disabled={isImporting}
          />
          {bulkStatus ? (
            <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {bulkStatus}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">SLA policies</CardTitle>
          <CardDescription>Fine tune delivery targets and cutoffs per region.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border/60 bg-card/60 p-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newSla.name}
                onChange={(event) => setNewSla((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. East – express"
              />
            </div>
            <div className="grid gap-2">
              <Label>Region</Label>
              <Input
                value={newSla.region}
                onChange={(event) => setNewSla((prev) => ({ ...prev, region: event.target.value }))}
                placeholder="Leave blank for global"
              />
            </div>
            <div className="grid gap-2">
              <Label>Service level</Label>
              <select
                value={newSla.serviceLevel}
                onChange={(event) => setNewSla((prev) => ({ ...prev, serviceLevel: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="same_day">Same day</option>
                <option value="next_day">Next day</option>
                <option value="standard">Standard</option>
              </select>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>Target (minutes)</Label>
                <Input
                  type="number"
                  value={newSla.targetMinutes}
                  onChange={(event) =>
                    setNewSla((prev) => ({ ...prev, targetMinutes: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Cut-off hour</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newSla.cutoffHour}
                  onChange={(event) =>
                    setNewSla((prev) => ({ ...prev, cutoffHour: Number(event.target.value) }))
                  }
                />
              </div>
            </div>
            <Button onClick={handleCreateSla} disabled={isSavingSla || !newSla.name.trim()}>
              Save policy
            </Button>
          </div>
          <div className="space-y-3">
            {slaPolicies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No SLA policies yet.</p>
            ) : (
              slaPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex flex-col gap-1 rounded-md border border-dashed border-border/70 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{policy.name}</span>
                    <Badge variant="info">{policy.serviceLevel.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {formatRegion(policy.region)} · Target {policy.targetMinutes} min · Cut-off {policy.cutoffHour}:00
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Dispatch rules</CardTitle>
          <CardDescription>
            Configure automatic assignment by region/vehicle with capacity caps.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border/60 bg-card/60 p-4">
            <div className="grid gap-2">
              <Label>Region</Label>
              <Input
                value={newRule.region}
                onChange={(event) => setNewRule((prev) => ({ ...prev, region: event.target.value }))}
                placeholder="Leave blank for global"
              />
            </div>
            <div className="grid gap-2">
              <Label>Vehicle type</Label>
              <select
                value={newRule.vehicleType}
                onChange={(event) => setNewRule((prev) => ({ ...prev, vehicleType: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.vehicle}>
                    {courier.vehicle}
                  </option>
                ))}
                <option value="">Any vehicle</option>
              </select>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>Max active shipments</Label>
                <Input
                  type="number"
                  value={newRule.maxActive}
                  onChange={(event) =>
                    setNewRule((prev) => ({ ...prev, maxActive: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={newRule.priority}
                  onChange={(event) =>
                    setNewRule((prev) => ({ ...prev, priority: Number(event.target.value) }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={newRule.enableAutoAssign}
                onChange={(event) =>
                  setNewRule((prev) => ({ ...prev, enableAutoAssign: event.target.checked }))
                }
              />
              Auto assign enabled
            </label>
            <Button onClick={handleCreateRule} disabled={isSavingRule}>
              Save rule
            </Button>
          </div>
          <div className="space-y-3">
            {dispatchRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dispatch rules configured.</p>
            ) : (
              dispatchRules
                .sort((a, b) => b.priority - a.priority)
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col gap-1 rounded-md border border-dashed border-border/70 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {formatRegion(rule.region)}
                      </span>
                      <Badge variant={rule.enableAutoAssign ? "success" : "warning"}>
                        Priority {rule.priority}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Vehicle {rule.vehicleType ?? "any"} · Max {rule.maxActiveShipments || "∞"}
                    </p>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {bulkStatus ? (
        <p className="lg:col-span-2 rounded-md bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {bulkStatus}
        </p>
      ) : null}
    </div>
  );
}
