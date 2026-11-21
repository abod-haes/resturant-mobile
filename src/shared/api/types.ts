import { z } from "zod";

export const departmentSchema = z.enum(["waiter", "hookah"]);
export type Department = z.infer<typeof departmentSchema>;

export const employeeSchema = z.object({
  id: z.string().min(1),
  role: z.literal("EMPLOYEE"),
  restaurantId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  department: departmentSchema.nullable().optional(),
  mustChangePassword: z.boolean(),
  username: z.string().optional(),
  name: z.string().optional(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime(),
  user: employeeSchema,
});
export type LoginSession = z.infer<typeof sessionSchema>;
export type LoginInput = { username: string; password: string };
export type ChangePasswordInput = { currentPassword: string; newPassword: string };

/** Backend v1.8 ShiftDto; do not confuse userId with a mock employeeId. */
export const shiftSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  branchId: z.string().min(1),
  department: departmentSchema,
  startedAt: z.string().datetime(),
  autoEndAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
});
export type Shift = z.infer<typeof shiftSchema>;

/**
 * Backend v1.8 CallHistoryDto.
 * Table label/floor/area are intentionally absent until backend supports
 * employee-readable location context. Never pretend tableId is a label.
 */
export const callSchema = z.object({
  id: z.string().min(1),
  branchId: z.string().min(1),
  tableId: z.string().min(1),
  type: departmentSchema,
  deliveryState: z.enum(["queued", "no_staff"]),
  recipientsCount: z.number().int().nonnegative(),
  ownerAlerted: z.boolean(),
  createdAt: z.string().datetime(),
});
export type ServiceCall = z.infer<typeof callSchema>;

export const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
export type CallPage = { data: ServiceCall[]; meta: z.infer<typeof pageMetaSchema> };
export type CallPageQuery = {
  cursor?: string | null;
  limit?: number;
  type?: Department;
};

/** Backend v1.9 device registry omits Expo tokens from every response. */
export const pushDeviceSchema = z.object({
  id: z.string().uuid(),
  platform: z.enum(["ios", "android"]),
  isActive: z.boolean(),
  lastSeenAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type PushDevice = z.infer<typeof pushDeviceSchema>;
export type RegisterDeviceInput = {
  expoPushToken: string;
  platform: "ios" | "android";
};

export interface EmployeeApi {
  setAccessToken(token: string | null): void;
  setReauthenticate(handler: (() => Promise<void>) | null): void;
  setPasswordChangeRequired(handler: (() => void) | null): void;
  login(input: LoginInput): Promise<LoginSession>;
  refresh(refreshToken: string): Promise<LoginSession>;
  getMe(): Promise<Employee>;
  logout(refreshToken: string): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  getCurrentShift(signal?: AbortSignal): Promise<Shift | null>;
  startShift(): Promise<Shift>;
  endShift(): Promise<Shift>;
  listCalls(query?: CallPageQuery, signal?: AbortSignal): Promise<CallPage>;
  listDevices(): Promise<PushDevice[]>;
  registerDevice(input: RegisterDeviceInput): Promise<PushDevice>;
  unregisterDevice(id: string): Promise<void>;
}
