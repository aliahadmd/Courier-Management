"use client";

import { useState } from "react";
import { LockKeyhole, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Role } from "@/lib/types";

interface LoginPanelProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  error?: string;
  loading?: boolean;
}

const demoCredentials: Array<{ role: Role; username: string; password: string; summary: string }> =
  [
    {
      role: "admin",
      username: "admin",
      password: "admin",
      summary: "Dispatch control centre",
    },
    {
      role: "courier",
      username: "courier",
      password: "courier",
      summary: "Driver cockpit",
    },
    {
      role: "customer",
      username: "customer",
      password: "customer",
      summary: "Parcel tracking hub",
    },
  ];

export function LoginPanel({ onLogin, error, loading }: LoginPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin({ username, password });
  }

  return (
    <TooltipProvider>
      <Card className="mx-auto w-full max-w-xl border border-border/80 shadow-lg">
        <CardHeader className="space-y-4">
          <Badge variant="info" className="w-fit gap-2">
            <Truck className="h-4 w-4" />
            CourierOS · Cloudflare Worker Preview
          </Badge>
          <div>
            <CardTitle className="text-2xl font-semibold text-foreground">
              Courier Management Console
            </CardTitle>
            <CardDescription>
              Demo environment with static credentials. Pick a role to explore the workflows.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Try admin, courier, or customer"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use the same value as username"
                required
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Enter dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Authentication is static for demo purposes — no data is persisted.
              </TooltipContent>
            </Tooltip>
            {error ? (
              <p className="text-sm font-medium text-destructive">
                {error} Try one of the roles listed below.
              </p>
            ) : null}
          </form>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo credentials
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {demoCredentials.map((entry) => (
                <div
                  key={entry.role}
                  className="rounded-md border border-dashed border-border/70 bg-muted/50 p-3 text-xs text-muted-foreground"
                >
                  <p className="font-semibold text-foreground">{entry.role}</p>
                  <p>
                    user: <span className="font-medium text-foreground">{entry.username}</span>
                  </p>
                  <p>
                    pass: <span className="font-medium text-foreground">{entry.password}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">{entry.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
