"use client";

import { ReactNode } from "react";
import { Bell, LogOut, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OnboardingModal } from "@/components/dashboard/onboarding/onboarding-modal";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import type { Role } from "@/lib/types";

const roleCopy: Record<Role, string> = {
  admin: "Admin · Dispatch",
  courier: "Courier · Field operations",
  customer: "Customer · Parcel tracking",
};

interface AppShellProps {
  role: Role;
  displayName: string;
  onSignOut: () => void;
  children: ReactNode;
}

export function AppShell({ role, displayName, onSignOut, children }: AppShellProps) {
  const { isOpen, step, setStep, dismiss, skip } = useOnboardingTour(role);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-muted/20">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Badge variant="info" className="gap-2">
                <Radio className="h-3.5 w-3.5" />
                On-cloud preview
              </Badge>
              <div>
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {roleCopy[role]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications sync automatically every minute.</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Return to role selection.</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
      <OnboardingModal
        role={role}
        open={isOpen}
        step={step}
        setStep={setStep}
        onDismiss={dismiss}
        onSkip={skip}
      />
    </TooltipProvider>
  );
}
