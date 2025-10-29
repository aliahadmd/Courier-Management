import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getShipmentByTracking } from "@/lib/db/dashboard";

export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  params: Promise<{ trackingId: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { trackingId } = await params;
  const shipment = await getShipmentByTracking(trackingId);

  if (!shipment) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Delivery receipt</h1>
          <p className="text-sm text-muted-foreground">
            Proof-of-delivery summary for tracking <strong>{shipment.trackingId}</strong>
          </p>
        </div>
        <Link href="/" className="text-sm text-primary underline">
          Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipment details</CardTitle>
          <CardDescription>{shipment.destination}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Service level
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-foreground">
              <Badge variant="info">{shipment.serviceLevel.replace("_", " ")}</Badge>
              <span>Region {shipment.region}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Status
            </p>
            <Badge variant="success" className="mt-1 w-fit">
              {shipment.status.replace("_", " ")}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Origin</p>
            <p className="text-sm text-foreground">{shipment.origin}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Destination</p>
            <p className="text-sm text-foreground">{shipment.destination}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
            <p className="text-sm text-foreground">
              {new Date(shipment.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last update</p>
            <p className="text-sm text-foreground">
              {new Date(shipment.lastUpdated).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
          <CardDescription>Key events from creation to completion.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {shipment.timeline.map((event, index) => (
              <li key={`${event.status}-${index}`} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="font-medium text-foreground">{event.status}</p>
                  <p>{new Date(event.timestamp).toLocaleString()}</p>
                  {event.note ? <p className="text-xs">{event.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proof of delivery</CardTitle>
          <CardDescription>
            Assets collected by the courier and recipients. Keys reference R2 object storage paths.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {shipment.proofs && shipment.proofs.length > 0 ? (
            shipment.proofs.map((proof) => (
              <div
                key={proof.id}
                className="flex flex-col gap-1 rounded-md border border-dashed border-border/70 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Badge variant={proof.kind === "signature" ? "warning" : "info"}>
                      {proof.kind}
                    </Badge>
                    {new Date(proof.uploadedAt).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground/80">{proof.uploadedBy ?? "courier"}</span>
                </div>
                <div className="h-px bg-border/60" />
                <code className="break-all text-muted-foreground">{proof.assetKey}</code>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No proof assets uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Route</CardTitle>
          <CardDescription>
            Planned checkpoints used for this delivery. Overlay a mapping provider to visualise on a
            map.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          {shipment.route.map((point, index) => (
            <div key={`${point.lat}-${point.lng}-${index}`} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-medium text-foreground">{point.label ?? "Waypoint"}</span>
              <span>
                ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
