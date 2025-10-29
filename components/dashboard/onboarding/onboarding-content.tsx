import type { LucideIcon } from "lucide-react";

import type { Role } from "@/lib/types";

export interface Step {
  title: string;
  description: string;
  spotlight: string;
  icon: LucideIcon;
  accent: string;
}

import {
  BarChart4,
  ClipboardList,
  Gauge,
  Handshake,
  MapPin,
  NotebookPen,
  PanelsTopLeft,
  Route,
  Sparkles,
} from "lucide-react";

const adminSteps: Step[] = [
  {
    title: "Operations cockpit",
    description:
      "Launch new parcels, import CSV manifests, and configure SLA targets without leaving the Operations tab.",
    spotlight: "Try the bulk import wizard to simulate real dispatch workload.",
    icon: PanelsTopLeft,
    accent: "from-blue-500/20 via-sky-500/10 to-transparent",
  },
  {
    title: "Auto-assignment rules",
    description:
      "Balance your fleet by region and vehicle capacity. Rules automatically hand off new jobs to the right courier.",
    spotlight: "Fine-tune max stops and priorities to keep couriers productive.",
    icon: Gauge,
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
  },
  {
    title: "Performance intelligence",
    description:
      "Track SLA compliance, delivery trends, and exceptions in real time — escalate delays before they snowball.",
    spotlight: "Filter analytics to preview client-ready reporting.",
    icon: BarChart4,
    accent: "from-purple-500/20 via-purple-500/10 to-transparent",
  },
];

const courierSteps: Step[] = [
  {
    title: "Smart manifest",
    description:
      "See every stop, timeline updates, and checklist guidance. Status updates sync instantly with dispatch.",
    spotlight: "Tap \"Mark picked up\" when parcels are on board.",
    icon: ClipboardList,
    accent: "from-orange-500/20 via-orange-500/10 to-transparent",
  },
  {
    title: "Proof toolkit",
    description:
      "Capture photos, signatures, and documents in one flow. Everything lands in the receipt automatically.",
    spotlight: "Upload multiple assets per stop — no more juggling apps.",
    icon: NotebookPen,
    accent: "from-rose-500/20 via-rose-500/10 to-transparent",
  },
  {
    title: "Operational heartbeat",
    description:
      "Keep an eye on dispatch updates, delays, and service tips right from your feed.",
    spotlight: "Watch for delay alerts before leaving the hub.",
    icon: Sparkles,
    accent: "from-cyan-500/20 via-cyan-500/10 to-transparent",
  },
];

const customerSteps: Step[] = [
  {
    title: "Personalised hub",
    description:
      "Track active shipments, delivery windows, and preferences in one clean space.",
    spotlight: "Switch tabs to review completed deliveries or upcoming orders.",
    icon: Handshake,
    accent: "from-indigo-500/20 via-indigo-500/10 to-transparent",
  },
  {
    title: "Live receipts",
    description:
      "Each delivery generates a receipt with timeline, route, and proof assets ready to share.",
    spotlight: "Open the receipt link to download proof-of-delivery.",
    icon: Route,
    accent: "from-teal-500/20 via-teal-500/10 to-transparent",
  },
  {
    title: "Stay notified",
    description:
      "Real-time updates help you coordinate handoffs with your team and courier.",
    spotlight: "Confirm delivery to instantly notify the courier you’re all set.",
    icon: MapPin,
    accent: "from-pink-500/20 via-pink-500/10 to-transparent",
  },
];

export function getTourSteps(role: Role) {
  switch (role) {
    case "admin":
      return adminSteps;
    case "courier":
      return courierSteps;
    case "customer":
      return customerSteps;
    default:
      return adminSteps;
  }
}

export function TourIllustration({ icon: Icon, accent }: { icon: LucideIcon; accent: string }) {
  return (
    <div
      className={"relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br " + accent}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-20 w-20 text-primary drop-shadow-lg" />
      </div>
    </div>
  );
}
