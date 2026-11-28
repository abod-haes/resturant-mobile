import type { EmployeeApi } from "./types";
import { liveEmployeeApi } from "./live";

// All runtime builds use the real backend; mocks are test fixtures only.
export const employeeApi: EmployeeApi = liveEmployeeApi;
export { ApiError, describeApiError, isUnauthorized } from "./errors";
export type { Employee, Shift, ServiceCall, Department } from "./types";
