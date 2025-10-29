import { useEffect, useState } from "react";

type RoleKey = "admin" | "courier" | "customer";

const STORAGE_KEY = "courier-dashboard-onboarding";

interface StoredState {
  onboarded: RoleKey[];
}

function readState(): StoredState {
  if (typeof window === "undefined") return { onboarded: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { onboarded: [] };
    const parsed = JSON.parse(raw) as StoredState;
    return {
      onboarded: Array.isArray(parsed.onboarded) ? parsed.onboarded : [],
    };
  } catch (error) {
    console.warn("Failed to parse onboarding state", error);
    return { onboarded: [] };
  }
}

function writeState(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist onboarding state", error);
  }
}

export function useOnboardingTour(role: RoleKey | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<StoredState>({ onboarded: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setState(readState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!role || !hydrated) return;
    const hasSeen = state.onboarded.includes(role);
    setIsOpen(!hasSeen);
    if (!hasSeen) {
      setStep(0);
    }
  }, [role, state.onboarded, hydrated]);

  const dismiss = (role: RoleKey) => {
    setState((prev) => {
      const next = {
        onboarded: Array.from(new Set([...prev.onboarded, role])),
      };
      writeState(next);
      return next;
    });
    setIsOpen(false);
  };

  return {
    isOpen,
    step,
    setStep,
    dismiss: role ? () => dismiss(role) : () => undefined,
    skip: role
      ? () => {
          setState((prev) => {
            const next = {
              onboarded: Array.from(new Set([...prev.onboarded, role])),
            };
            writeState(next);
            return next;
          });
          setIsOpen(false);
        }
      : () => undefined,
  };
}
