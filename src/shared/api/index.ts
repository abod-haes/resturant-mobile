import type { EmployeeApi } from "./types";
import { liveEmployeeApi } from "./live";
import { mockEmployeeApi } from "./mock";

// Fail closed: a release build can never use the insecure development adapter.
export const isMockMode = __DEV__ && process.env.EXPO_PUBLIC_API_MODE !== "live";
export const employeeApi: EmployeeApi = isMockMode ? mockEmployeeApi : liveEmployeeApi;
export { ApiError, describeApiError, isUnauthorized } from "./errors";
export type { Employee, Shift, ServiceCall, Department } from "./types";
