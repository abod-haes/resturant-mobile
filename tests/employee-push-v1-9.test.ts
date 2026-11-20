import { beforeEach, describe, expect, it, vi } from "vitest";
import { pushDeviceSchema } from "../src/shared/api/types";
import { mockEmployeeApi } from "../src/shared/api/mock";

const id = "123e4567-e89b-42d3-a456-426614174000";
const time = "2026-11-20T12:00:00.000Z";
const registration = { expoPushToken: "ExpoPushToken[abcdefghijklmnopqrst1234567890]", platform: "android" as const };
const device = { id, platform: "android", isActive: true, lastSeenAt: time, createdAt: time };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json" },
});

describe("employee Expo push device registry, backend v1.9", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("EXPO_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });

  it("parses redacted device DTO, never assumes token comes from backend", () => {
    expect(pushDeviceSchema.parse(device)).not.toHaveProperty("expoPushToken");
    expect(pushDeviceSchema.safeParse({ ...device, id: "not-uuid" }).success).toBe(false);
  });

  it("sends authenticated registration, lists devices and securely unregisters", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/employee/devices") && !url.endsWith("/" + id)) {
        return json({ data: url.includes("/list") ? [device] : device }, 201);
      }
      return json({ data: { unregistered: true } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const live = (await import("../src/shared/api/live")).liveEmployeeApi;
    live.setAccessToken("fake-test-jwt");
    const created = await live.registerDevice(registration);
    expect(created).toEqual(device);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    expect(body).toEqual(registration);
    expect(fetchMock.mock.calls[0][0]).toContain("/employee/devices");
    await expect(live.unregisterDevice(id)).resolves.toBeUndefined();
    await expect(live.unregisterDevice("invalid")).rejects.toMatchObject({ status: 400 });
  });

  it("mock registration is idempotent, redacted and tied to the employee account", async () => {
    mockEmployeeApi.setAccessToken(null);
    await mockEmployeeApi.login({ username: "waiter.demo", password: "preview" });
    const created = await mockEmployeeApi.registerDevice(registration);
    expect(created).not.toHaveProperty("expoPushToken");
    const repeat = await mockEmployeeApi.registerDevice(registration);
    expect(repeat.id).toBe(created.id);
    expect((await mockEmployeeApi.listDevices()).some(d => d.id === created.id)).toBe(true);
    await expect(mockEmployeeApi.registerDevice({ expoPushToken: "invalid", platform: "android" }))
      .rejects.toMatchObject({ status: 400 });
    await mockEmployeeApi.login({ username: "hookah.demo", password: "preview" });
    expect((await mockEmployeeApi.listDevices()).some(d => d.id === created.id)).toBe(false);
    await expect(mockEmployeeApi.unregisterDevice(created.id)).rejects.toMatchObject({ status: 404 });
    await mockEmployeeApi.login({ username: "waiter.demo", password: "preview" });
    await mockEmployeeApi.unregisterDevice(created.id);
    expect((await mockEmployeeApi.listDevices()).some(d => d.id === created.id)).toBe(false);
  });
});
