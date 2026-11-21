/** Shared query key factory; all authenticated caches are user-scoped. */
export const employeeKeys = {
  shift: (id: string | undefined) => ["employee", id, "shift"] as const,
  calls: (id: string | undefined, type?: string) =>
    ["employee", id, "calls", ...(type ? [type] : [])] as const,
  callsRoot: (id: string | undefined) => ["employee", id, "calls"] as const,
  devices: (id: string | undefined) => ["employee", id, "devices"] as const,
} as const;
