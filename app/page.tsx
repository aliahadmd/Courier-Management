"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoginPanel } from "@/components/auth/login-panel";
import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { CourierDashboard } from "@/components/dashboard/courier/courier-dashboard";
import { CustomerDashboard } from "@/components/dashboard/customer/customer-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { getCourierAssignments, getCustomerShipments } from "@/lib/metrics";
import { ROLE_CREDENTIALS } from "@/lib/demo-auth";
import type { DashboardSnapshot, Role, RoleCredentials } from "@/lib/types";

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
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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

  const fetchSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load dashboard (${response.status})`);
      }
      const data = (await response.json()) as DashboardSnapshot;
      setSnapshot(data);
      setLastUpdated(new Date(data.generatedAt));
      setSnapshotError(null);
    } catch (err) {
      console.error(err);
      setSnapshotError("Unable to load live data. Please try again.");
    } finally {
      setSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setSnapshot(null);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    fetchSnapshot();
  }, [session, fetchSnapshot]);

  useEffect(() => {
    if (!session || typeof window === "undefined") return;

    const eventSource = new EventSource("/api/updates");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DashboardSnapshot;
        setSnapshot(data);
        setLastUpdated(new Date(data.generatedAt));
        setSnapshotError(null);
      } catch (err) {
        console.error("Failed to parse event payload", err);
      }
    };
    eventSource.onerror = (err) => {
      console.warn("SSE connection dropped", err);
      eventSource.close();
      eventSourceRef.current = null;
    };
    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [session]);

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

  const handleRefresh = useCallback(async () => {
    await fetchSnapshot();
  }, [fetchSnapshot]);

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

  if (snapshotLoading && !snapshot) {
    return (
      <AppShell role={session.role} displayName={session.displayName} onSignOut={handleSignOut}>
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Syncing live data…
        </div>
      </AppShell>
    );
  }

  if (!snapshot) {
    return (
      <AppShell role={session.role} displayName={session.displayName} onSignOut={handleSignOut}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            {snapshotError ??
              "We couldn't load your dashboard data yet. Refresh or retry shortly."}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={session.role} displayName={session.displayName} onSignOut={handleSignOut}>
      {session.role === "admin" && (
        <AdminDashboard
          shipments={snapshot.shipments}
          couriers={snapshot.couriers}
          customers={snapshot.customers}
          metrics={snapshot.metrics}
          performance={snapshot.performance}
          trend={snapshot.trend}
          leaderboard={snapshot.leaderboard}
          regionPerformance={snapshot.regionPerformance}
          events={snapshot.recentEvents}
          lastUpdatedLabel={lastUpdatedLabel}
          role={session.role}
          onRefresh={handleRefresh}
          slaPolicies={snapshot.slaPolicies}
          dispatchRules={snapshot.dispatchRules}
        />
      )}

      {session.role === "courier" && (
        <CourierDashboard
          courier={
            snapshot.couriers.find((courier) => courier.id === session.contextId) ??
            snapshot.couriers[0]
          }
          shipments={getCourierAssignments(
            session.contextId ?? snapshot.couriers[0]?.id ?? "",
            snapshot.shipments
          )}
          events={snapshot.recentEvents}
          onRefresh={handleRefresh}
        />
      )}

      {session.role === "customer" && (
        <CustomerDashboard
          customer={
            snapshot.customers.find((customer) => customer.id === session.contextId) ??
            snapshot.customers[0]
          }
          shipments={getCustomerShipments(
            session.contextId ?? snapshot.customers[0]?.id ?? "",
            snapshot.shipments
          )}
          supportLine="+1 (800) 555-1212"
          onRefresh={handleRefresh}
        />
      )}
    </AppShell>
  );
}
