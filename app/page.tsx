"use client";

import { useEffect, useMemo, useState } from "react";

import { LoginPanel } from "@/components/auth/login-panel";
import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { CourierDashboard } from "@/components/dashboard/courier/courier-dashboard";
import { CustomerDashboard } from "@/components/dashboard/customer/customer-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import {
  COURIER_LEADERBOARD,
  COURIERS,
  CUSTOMERS,
  DELIVERY_TRENDS,
  PERFORMANCE_SUMMARY,
  RECENT_EVENTS,
  REGION_PERFORMANCE,
  ROLE_CREDENTIALS,
  SHIPMENTS,
} from "@/lib/mock-data";
import {
  calculateDashboardMetrics,
  getCourierAssignments,
  getCustomerShipments,
} from "@/lib/metrics";
import type { Role, RoleCredentials } from "@/lib/types";

interface SessionState {
  role: Role;
  displayName: string;
  contextId?: string;
}

const REFRESH_INTERVAL_MS = 45_000;
const SESSION_STORAGE_KEY = "courier-dashboard-session";

function formatRelative(date: Date) {
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 10) return "just now";
  if (diffSeconds < 60) return `${diffSeconds} sec ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SessionState>;
        if (parsed?.role && parsed?.displayName) {
          setSession({
            role: parsed.role,
            displayName: parsed.displayName,
            contextId: parsed.contextId,
          });
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.warn("Failed to restore session:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      if (session) {
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            role: session.role,
            displayName: session.displayName,
            contextId: session.contextId,
          })
        );
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Failed to persist session:", error);
    }
  }, [session, isHydrated]);

  const dashboardMetrics = useMemo(
    () => calculateDashboardMetrics(SHIPMENTS, COURIERS),
    []
  );

  const lastUpdatedLabel = useMemo(() => formatRelative(lastUpdated), [lastUpdated]);

  function handleLogin(credentials: { username: string; password: string }) {
    const match = ROLE_CREDENTIALS.find(
      (item) =>
        item.username.toLowerCase() === credentials.username.toLowerCase().trim() &&
        item.password === credentials.password.trim()
    ) as RoleCredentials | undefined;

    if (!match) {
      setError("Incorrect username or password.");
      return;
    }

    setSession({
      role: match.role,
      displayName: match.displayName,
      contextId: match.contextId,
    });
    setError(undefined);
    setLastUpdated(new Date());
  }

  function handleSignOut() {
    setSession(null);
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12 text-sm text-muted-foreground">
        Preparing courier workspace…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
        <LoginPanel onLogin={handleLogin} error={error} />
      </div>
    );
  }

  return (
    <AppShell role={session.role} displayName={session.displayName} onSignOut={handleSignOut}>
      {session.role === "admin" && (
        <AdminDashboard
          shipments={SHIPMENTS}
          couriers={COURIERS}
          customers={CUSTOMERS}
          metrics={dashboardMetrics}
          performance={PERFORMANCE_SUMMARY}
          trend={DELIVERY_TRENDS}
          leaderboard={COURIER_LEADERBOARD}
          regionPerformance={REGION_PERFORMANCE}
          events={RECENT_EVENTS}
          lastUpdatedLabel={lastUpdatedLabel}
          role={session.role}
        />
      )}

      {session.role === "courier" && (
        <CourierDashboard
          courier={
            COURIERS.find((courier) => courier.id === session.contextId) ?? COURIERS[0]
          }
          shipments={getCourierAssignments(
            session.contextId ?? COURIERS[0].id,
            SHIPMENTS
          )}
          events={RECENT_EVENTS}
        />
      )}

      {session.role === "customer" && (
        <CustomerDashboard
          customer={
            CUSTOMERS.find((customer) => customer.id === session.contextId) ?? CUSTOMERS[0]
          }
          shipments={getCustomerShipments(session.contextId ?? CUSTOMERS[0].id, SHIPMENTS)}
          supportLine="+1 (800) 555-1212"
        />
      )}
    </AppShell>
  );
}
