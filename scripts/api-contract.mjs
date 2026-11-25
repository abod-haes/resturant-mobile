#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const target = resolve("contracts/employee.openapi.json");
const routes = {
  "/api/v1/auth/login": ["post"],
  "/api/v1/auth/refresh": ["post"],
  "/api/v1/auth/logout": ["post"],
  "/api/v1/auth/me": ["get"],
  "/api/v1/auth/restaurant-identity": ["get"],
  "/api/v1/auth/change-password": ["post"],
  "/api/v1/employee/shifts/start": ["post"],
  "/api/v1/employee/shifts/current": ["get"],
  "/api/v1/employee/shifts/end": ["post"],
  "/api/v1/employee/calls": ["get"],
  "/api/v1/employee/events": ["get"],
  "/api/v1/employee/devices": ["get", "post"],
  "/api/v1/employee/devices/{id}": ["delete"],
};
const readJSON = (path) => JSON.parse(readFileSync(path, "utf8"));
const assert = (test, message) => { if (!test) throw new Error("OpenAPI: " + message); };
const contractTitle = "Restaurant Employee API — backend runtime extracted slice";
function validate(doc) {
  assert(doc.openapi?.startsWith("3."), "OpenAPI 3 required");
  assert(doc.info?.version === "0.12.0", "Backend contract version changed");
  for (const [path, methods] of Object.entries(routes))
    for (const method of methods) assert(doc.paths?.[path]?.[method], "Missing " + method + " " + path);
  const schemas = doc.components?.schemas ?? {};
  for (const type of ["LoginDataDto", "LoginResponseDto", "UserDto", "ShiftDto", "CallHistoryDto", "PushDeviceDto", "ApiErrorEnvelope", "AuthenticatedRestaurantIdentityDto", "AuthenticatedRestaurantIdentityResponseDto", "BrandingDto"])
    assert(schemas[type], "Missing schema " + type);
  for (const field of ["id", "userId", "branchId", "department", "autoEndAt", "endedAt"])
    assert(schemas.ShiftDto.properties?.[field], "Shift is missing " + field);
  for (const field of ["id", "tableId", "type", "deliveryState", "recipientsCount", "ownerAlerted", "createdAt"])
    assert(schemas.CallHistoryDto.properties?.[field], "Calls are missing " + field);
  assert(schemas.LoginDataDto.properties?.refreshToken, "Missing mobile refresh token");
  assert(!schemas.PushDeviceDto.properties?.expoPushToken, "Push token must never appear in device responses");
}
function extract(full) {
  const paths = {};
  for (const [path, item] of Object.entries(full.paths ?? {})) {
    if (!path.startsWith("/api/v1/auth/") && !path.startsWith("/api/v1/employee/")) continue;
    paths[path] = {};
    for (const [method, operation] of Object.entries(item)) {
      const op = {};
      if (operation.parameters?.length)
        op.parameters = operation.parameters.map(param =>
          Object.fromEntries(Object.entries(param).filter(([key]) =>
            ["name", "in", "required", "schema"].includes(key))));
      if (operation.requestBody) {
        op.requestBody = {
          content: Object.fromEntries(Object.entries(operation.requestBody.content ?? {})
            .filter(([, entry]) => entry.schema).map(([mime, entry]) => [mime, { schema: entry.schema }])),
          required: operation.requestBody.required ?? false,
        };
      }
      if (operation.responses)
        op.responses = Object.fromEntries(Object.entries(operation.responses).map(([status, r]) => {
          const next = { description: r.description ?? "" };
          if (r.content) next.content = Object.fromEntries(Object.entries(r.content)
            .filter(([, entry]) => entry.schema).map(([mime, entry]) => [mime, { schema: entry.schema }]));
          return [status, next];
        }));
      paths[path][method] = op;
    }
  }
  const refs = new Set();
  function collect(v) {
    if (Array.isArray(v)) { v.forEach(collect); return; }
    if (!v || typeof v !== "object") return;
    for (const [key, item] of Object.entries(v))
      if (key === "$ref" && typeof item === "string") refs.add(item.split("/").at(-1));
      else collect(item);
  }
  collect(paths);
  const visited = new Set();
  while (visited.size !== refs.size) {
    for (const ref of refs) {
      if (visited.has(ref)) continue;
      visited.add(ref);
      const schema = full.components?.schemas?.[ref];
      assert(schema, "Unresolved schema reference " + ref);
      collect(schema);
    }
  }
  return {
    openapi: full.openapi,
    info: { title: contractTitle, version: full.info?.version },
    paths,
    components: { schemas: Object.fromEntries([...refs].sort().map(ref => [ref, full.components.schemas[ref]])) },
  };
}
try {
  const [operation = "check", fullJson] = process.argv.slice(2);
  assert(["check", "update"].includes(operation), "Unknown action");
  const snapshot = operation === "check" ? readJSON(target) : null;
  if (snapshot) validate(snapshot);
  if (fullJson) {
    const full = readJSON(resolve(fullJson));
    assert(full.info?.version === "0.12.0", "Runtime Swagger version differs, review backend upgrade first");
    const latest = extract(full);
    validate(latest);
    if (operation === "update") {
      writeFileSync(target, JSON.stringify(latest) + "\n");
      process.stdout.write("Updated from runtime OpenAPI JSON.\n");
    } else {
      assert(JSON.stringify(latest) === JSON.stringify(snapshot), "Runtime contract drift detected");
      process.stdout.write("Runtime OpenAPI matches pinned snapshot.\n");
    }
  } else {
    assert(operation === "check", "Provide a runtime Swagger JSON for update");
    process.stdout.write("Pinned runtime OpenAPI snapshot passed structural checks.\n");
  }
} catch (error) { process.stderr.write(String(error) + "\n"); process.exitCode = 1; }
