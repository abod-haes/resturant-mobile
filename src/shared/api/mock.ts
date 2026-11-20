import { ApiError } from "./errors";
import type { EmployeeApi, Employee, CallPageQuery, ServiceCall, Shift, Department, PushDevice } from "./types";
import { mockDb, mockDelay, mockControl } from "../mock/engine";

interface MockDevice extends PushDevice { employeeId: string; token: string }
const devices: MockDevice[] = [];
let deviceCounter = 0;
function visibleDevice(device: MockDevice): PushDevice {
  return { id: device.id, platform: device.platform, isActive: device.isActive,
    lastSeenAt: device.lastSeenAt, createdAt: device.createdAt };
}
let accessToken: string | null = null;
const TOKEN_PREFIX = "mock-employee:";
const REFRESH_PREFIX = "mock-refresh:";

function employeeById(id: string) {
  return mockDb.list("employees").find((item) => item.id === id && !item.archivedAt);
}
function currentEmployee() {
  const id = accessToken?.startsWith(TOKEN_PREFIX) ? accessToken.slice(TOKEN_PREFIX.length) : null;
  const employee = id ? employeeById(id) : null;
  if (!employee) throw new ApiError("UNAUTHORIZED", 401, "الجلسة غير صالحة.");
  return employee;
}
function profile(): Employee {
  const employee = currentEmployee();
  const branch = mockDb.list("branches").find((item) => item.id === employee.branchId);
  return {
    id: employee.id,
    username: employee.username,
    name: employee.name,
    role: "EMPLOYEE",
    branchId: employee.branchId,
    restaurantId: branch?.restaurantId,
    department: employee.department === "hookah" ? "hookah" : "waiter",
    mustChangePassword: false,
  };
}
function session() {
  const user = profile();
  return {
    accessToken: TOKEN_PREFIX + user.id,
    refreshToken: REFRESH_PREFIX + user.id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    user,
  };
}
const MOCK_SHIFT_MS = 12 * 60 * 60 * 1000;
function asShift(
  row: { id: string; employeeId: string; branchId: string; startedAt: string; endedAt: string | null },
  department: Department,
): Shift {
  return {
    id: row.id,
    userId: row.employeeId,
    branchId: row.branchId,
    department,
    startedAt: row.startedAt,
    autoEndAt: new Date(Date.parse(row.startedAt) + MOCK_SHIFT_MS).toISOString(),
    endedAt: row.endedAt,
  };
}

export const mockEmployeeApi: EmployeeApi = {
  setAccessToken(next) { accessToken = next; },
  setReauthenticate() { /* Development adapter has non-expiring simulated sessions. */ },
  async login({ username, password }) {
    await mockDelay();
    if (!password.trim()) throw new ApiError("VALIDATION_ERROR", 422, "أدخل كلمة المرور.");
    const employee = mockDb.list("employees").find(
      (item) => item.username === username.trim() && !item.archivedAt,
    );
    if (!employee) throw new ApiError("UNAUTHORIZED", 401, "اسم المستخدم غير موجود في البيانات التجريبية.");
    accessToken = TOKEN_PREFIX + employee.id;
    return session();
  },
  async refresh(refreshToken) {
    await mockDelay();
    const id = refreshToken.startsWith(REFRESH_PREFIX) ? refreshToken.slice(REFRESH_PREFIX.length) : "";
    if (!employeeById(id)) throw new ApiError("UNAUTHORIZED", 401, "جلسة تجريبية غير صالحة.");
    accessToken = TOKEN_PREFIX + id;
    return session();
  },
  async getMe() {
    await mockDelay();
    return profile();
  },
  async logout() {
    await mockDelay();
    accessToken = null;
  },
  async changePassword({ currentPassword, newPassword }) {
    await mockDelay();
    currentEmployee();
    if (!currentPassword.trim() || newPassword.length < 12)
      throw new ApiError("VALIDATION_ERROR", 422, "كلمة المرور الجديدة قصيرة.");
    accessToken = null;
  },
  async getCurrentShift() {
    await mockDelay();
    const employee = currentEmployee();
    const shift = mockDb.list("shifts").find((item) =>
      item.employeeId === employee.id && !item.endedAt &&
      Date.parse(item.startedAt) + MOCK_SHIFT_MS > Date.now(),
    );
    return shift ? asShift(shift, employee.department === "hookah" ? "hookah" : "waiter") : null;
  },
  async startShift() {
    await mockDelay();
    const employee = currentEmployee();
    const existing = mockDb.list("shifts").find((item) =>
      item.employeeId === employee.id && !item.endedAt &&
      Date.parse(item.startedAt) + MOCK_SHIFT_MS > Date.now(),
    );
    if (existing) throw new ApiError("SHIFT_ALREADY_ACTIVE", 409, "الدوام مفتوح بالفعل.");
    const newShift = {
      id: "shift-" + Date.now(),
      employeeId: employee.id,
      branchId: employee.branchId,
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    const state = mockControl.snapshot();
    mockControl.setState({ ...state, shifts: [...state.shifts, newShift] });
    return asShift(newShift, employee.department === "hookah" ? "hookah" : "waiter");
  },
  async endShift() {
    await mockDelay();
    const employee = currentEmployee();
    const state = mockControl.snapshot();
    const current = state.shifts.find((shift) => shift.employeeId === employee.id && !shift.endedAt &&
      Date.parse(shift.startedAt) + MOCK_SHIFT_MS > Date.now());
    if (!current) throw new ApiError("SHIFT_NOT_ACTIVE", 409, "لا يوجد دوام مفتوح.");
    const endedAt = new Date().toISOString();
    mockControl.setState({
      ...state,
      shifts: state.shifts.map((shift) =>
        shift.id === current.id ? { ...shift, endedAt } : shift),
    });
    return asShift({ ...current, endedAt }, employee.department === "hookah" ? "hookah" : "waiter");
  },
  async listCalls(query: CallPageQuery = {}) {
    await mockDelay();
    const employee = currentEmployee();
    const branch = mockDb.list("branches").find((item) => item.id === employee.branchId);
    // Mock approximates historical assignment using legacy fixture routing.
    // Production history is enforced by backend call_outbox recipient ID.
    const rows: ServiceCall[] = mockDb.list("calls")
      .filter((call) => call.branchId === employee.branchId)
      .filter((call) => branch?.callSettings.routingMode === "all" ||
        branch?.callSettings.routingMode === "all_on_shift" || call.type === employee.department)
      .filter((call) => !query.type || call.type === query.type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .map((call) => ({
        id: call.id,
        branchId: call.branchId,
        tableId: call.tableId,
        type: call.type === "hookah" ? "hookah" : "waiter",
        deliveryState: call.deliveryState === "no_staff" ? "no_staff" : "queued",
        recipientsCount: call.deliveryState === "no_staff" ? 0 : 1,
        ownerAlerted: call.ownerAlerted,
        createdAt: call.createdAt,
      }));
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const position = query.cursor ? rows.findIndex((call) => call.id === query.cursor) : -1;
    if (query.cursor && position < 0) throw new ApiError("VALIDATION_ERROR", 422, "مؤشر الصفحة غير صالح.");
    const page = rows.slice(position + 1, position + 1 + limit);
    return {
      data: page,
      meta: {
        hasMore: position + 1 + limit < rows.length,
        nextCursor: position + 1 + limit < rows.length ? page[page.length - 1]?.id ?? null : null,
      },
    };
  },
  async listDevices() {
    await mockDelay();
    const employee = currentEmployee();
    return devices.filter(device => device.employeeId === employee.id && device.isActive)
      .map(visibleDevice);
  },
  async registerDevice(input) {
    await mockDelay();
    const employee = currentEmployee();
    if (!/^(?:Expo|Exponent)PushToken\\[[A-Za-z0-9_-]{10,256}\\]$/.test(input.expoPushToken) ||
      !["ios", "android"].includes(input.platform)) {
      throw new ApiError("VALIDATION_ERROR", 400, "رمز الجهاز أو نظامه غير صالح.");
    }
    const owned = devices.filter(device => device.employeeId === employee.id && device.isActive);
    const existing = owned.find(device => device.token === input.expoPushToken);
    if (existing) return visibleDevice(existing);
    if (owned.length >= 5) throw new ApiError("DEVICE_LIMIT_REACHED", 409, "تجاوزت عدد الأجهزة المسموح.");
    for (const device of devices) {
      if (device.token === input.expoPushToken && device.employeeId !== employee.id && device.isActive) {
        throw new ApiError("DEVICE_ALREADY_REGISTERED", 409, "الجهاز مرتبط بحساب آخر.");
      }
    }
    deviceCounter += 1;
    const at = new Date().toISOString();
    const device: MockDevice = {
      id: "00000000-0000-4000-8000-" + String(deviceCounter).padStart(12, "0"),
      employeeId: employee.id, token: input.expoPushToken, platform: input.platform,
      isActive: true, lastSeenAt: at, createdAt: at,
    };
    devices.push(device);
    return visibleDevice(device);
  },
  async unregisterDevice(id) {
    await mockDelay();
    const employee = currentEmployee();
    const device = devices.find(item => item.id === id && item.employeeId === employee.id && item.isActive);
    if (!device) throw new ApiError("NOT_FOUND", 404, "الجهاز غير موجود.");
    device.isActive = false;
  },
};
