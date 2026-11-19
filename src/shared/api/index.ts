import type { EmployeeApi } from "./types";
import { liveEmployeeApi } from "./live";
import { mockEmployeeApi } from "./mock";

export const isMockMode = process.env.EXPO_PUBLIC_API_MODE !== "live";
export const employeeApi: EmployeeApi = isMockMode ? mockEmployeeApi : liveEmployeeApi;
export { ApiError, describeApiError, isUnauthorized } from "./errors";
export type { Employee, Shift, ServiceCall, Department } from "./types";
