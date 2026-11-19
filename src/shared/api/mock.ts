import { ApiError } from "./errors";
import type { EmployeeApi, Employee, CallPageQuery, ServiceCall } from "./types";
import { mockDb, mockDelay, mockControl } from "../mock/engine";

let accessToken: string | null = null;
const TOKEN_PREFIX = "mock-employee:";

function currentEmployee() {
  const id = accessToken?.startsWith(TOKEN_PREFIX)
    ? accessToken.slice(TOKEN_PREFIX.length)
    : null;
  const employee = id ? mockDb.list("employees").find((item) => item.id === id && !item.archivedAt) : null;
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
  };
}

export const mockEmployeeApi: EmployeeApi = {
  setAccessToken(next) { accessToken = next; },
  async login({ username, password }) {
    await mockDelay();
    // Development adapter only: no real password verification or fixture passwords.
    if (!password.trim()) throw new ApiError("VALIDATION_ERROR", 422, "أدخل كلمة المرور.");
    const employee = mockDb.list("employees").find(
      (item) => item.username === username.trim() && !item.archivedAt,
    );
    if (!employee) throw new ApiError("UNAUTHORIZED", 401, "اسم المستخدم غير موجود في البيانات التجريبية.");
    accessToken = TOKEN_PREFIX + employee.id;
    return {
      accessToken,
      user: profile(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },
  async getMe() {
    await mockDelay();
    return profile();
  },
  async logout() {
    await mockDelay();
    accessToken = null;
  },
  async getCurrentShift() {
    await mockDelay();
    const employee = currentEmployee();
    const shift = mockDb.list("shifts").find(
      (item) => item.employeeId === employee.id && !item.endedAt,
    );
    return shift
      ? { id: shift.id, employeeId: employee.id, startedAt: shift.startedAt, endedAt: null }
      : null;
  },
  async startShift() {
    await mockDelay();
    const employee = currentEmployee();
    const existing = mockDb.list("shifts").find(
      (item) => item.employeeId === employee.id && !item.endedAt,
    );
    if (existing)
      return { id: existing.id, employeeId: employee.id, startedAt: existing.startedAt, endedAt: null };
    const newShift = {
      id: "shift-" + Date.now(),
      employeeId: employee.id,
      branchId: employee.branchId,
      startedAt: new Date().toISOString(),
      endedAt: null,
    };
    const state = mockControl.snapshot();
    mockControl.setState({ ...state, shifts: [...state.shifts, newShift] });
    return { id: newShift.id, employeeId: employee.id, startedAt: newShift.startedAt, endedAt: null };
  },
  async endShift() {
    await mockDelay();
    const employee = currentEmployee();
    const state = mockControl.snapshot();
    mockControl.setState({
      ...state,
      shifts: state.shifts.map((shift) =>
        shift.employeeId === employee.id && !shift.endedAt
          ? { ...shift, endedAt: new Date().toISOString() }
          : shift,
      ),
    });
  },
  async listCalls(query: CallPageQuery = {}) {
    await mockDelay();
    const employee = currentEmployee();
    const branch = mockDb.list("branches").find((item) => item.id === employee.branchId);
    const tables = mockDb.list("tables");
    const areas = mockDb.list("areas");
    const floors = mockDb.list("floors");
    const rows: ServiceCall[] = mockDb.list("calls")
      .filter((call) => call.branchId === employee.branchId)
      .filter((call) => branch?.callSettings.routingMode === "all" || call.type === employee.department)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
      .map((call) => {
        const table = tables.find((item) => item.id === call.tableId);
        const area = areas.find((item) => item.id === table?.areaId);
        return {
          id: call.id,
          branchId: call.branchId,
          tableId: call.tableId,
          tableNumber: table?.number,
          area: area?.name,
          floor: floors.find((item) => item.id === area?.floorId)?.name,
          type: call.type === "hookah" ? "hookah" : "waiter",
          createdAt: call.createdAt,
        };
      });
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
};
