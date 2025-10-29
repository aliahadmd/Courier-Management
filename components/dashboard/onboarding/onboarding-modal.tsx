"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalCloseButton } from "@/components/ui/modal";
import type { Role } from "@/lib/types";

import { getTourSteps, TourIllustration } from "./onboarding-content";

interface OnboardingModalProps {
  role: Role;
  open: boolean;
  step: number;
  setStep: (next: number) => void;
  onDismiss: () => void;
  onSkip: () => void;
}

const roleCopy: Record<Role, { title: string; tagline: string }> = {
  admin: {
    title: "Welcome to Dispatch HQ",
    tagline: "Launch, balance, and measure your network in minutes.",
  },
  courier: {
    title: "Welcome to your run sheet",
    tagline: "Navigate stops, log proofs, and stay synced with dispatch.",
  },
  customer: {
    title: "Welcome to the parcel hub",
    tagline: "Track deliveries, confirm drop-offs, and stay informed.",
  },
};

export function OnboardingModal({
  role,
  open,
  step,
  setStep,
  onDismiss,
  onSkip,
}: OnboardingModalProps) {
  const steps = getTourSteps(role);
  const { title, tagline } = roleCopy[role];
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Modal open={open} onOpenChange={(value) => (!value ? onSkip() : null)}>
      <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <ModalCloseButton />
        <div className="space-y-4 pr-4">
          <Badge variant="info" className="inline-flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            Guided tour
          </Badge>
          <div>
            <DialogPrimitive.Title asChild>
              <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <p className="text-sm text-muted-foreground">{tagline}</p>
            </DialogPrimitive.Description>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
            <motion.div
              key={current.title}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="space-y-3 p-4"
            >
              <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
              <p className="text-sm text-muted-foreground">{current.description}</p>
              <p className="text-xs text-primary/80">{current.spotlight}</p>
            </motion.div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSkip()}
              className="gap-1"
            >
              Skip tour
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(Math.max(step - 1, 0))}
                disabled={step === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  step === steps.length - 1 ? onDismiss() : setStep(Math.min(step + 1, steps.length - 1))
                }
                className="gap-1"
              >
                {step === steps.length - 1 ? "Let’s go" : "Next"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="relative">
          <TourIllustration icon={current.icon} accent={current.accent} />
        </div>
      </div>
    </Modal>
  );
}
