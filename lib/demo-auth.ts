import type { RoleCredentials } from "./types";

export const ROLE_CREDENTIALS: RoleCredentials[] = [
  {
    username: "admin",
    password: "admin",
    role: "admin",
    displayName: "Avery Miles",
  },
  {
    username: "courier",
    password: "courier",
    role: "courier",
    displayName: "Jordan Reed",
    contextId: "courier-001",
  },
  {
    username: "customer",
    password: "customer",
    role: "customer",
    displayName: "Priya Patel",
    contextId: "cust-001",
  },
];
