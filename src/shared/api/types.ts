import { z } from "zod";

export const employeeSchema = z.object({
  id: z.string(),
  role: z.literal("EMPLOYEE"),
  restaurantId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  department: z.enum(["waiter", "hookah"]).nullable().optional(),
  mustChangePassword: z.boolean(),
  username: z.string().optional(),
  name: z.string().optional(),
});
export type Employee = z.infer<typeof employeeSchema>;
export type Department = "waiter" | "hookah";

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime(),
  user: employeeSchema,
});
export type LoginSession = z.infer<typeof sessionSchema>;
export type LoginInput = { username: string; password: string };
export type ChangePasswordInput = { currentPassword: string; newPassword: string };

export const shiftSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullish(),
});
export type Shift = z.infer<typeof shiftSchema>;

export const callSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  type: z.enum(["waiter", "hookah"]),
  createdAt: z.string(),
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
  floor: z.string().optional(),
  area: z.string().optional(),
});
export type ServiceCall = z.infer<typeof callSchema>;

export const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
export type CallPage = { data: ServiceCall[]; meta: z.infer<typeof pageMetaSchema> };
export type CallPageQuery = { cursor?: string | null; limit?: number };

export interface EmployeeApi {
  setAccessToken(token: string | null): void;
  setReauthenticate(handler: (() => Promise<void>) | null): void;
  login(input: LoginInput): Promise<LoginSession>;
  refresh(refreshToken: string): Promise<LoginSession>;
  getMe(): Promise<Employee>;
  logout(refreshToken: string): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  getCurrentShift(): Promise<Shift | null>;
  startShift(): Promise<Shift>;
  endShift(): Promise<void>;
  listCalls(query?: CallPageQuery): Promise<CallPage>;
}
