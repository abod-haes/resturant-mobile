/**
 * Compile-time parity checks against the executable backend Swagger typegen.
 * Runtime Zod keeps enforcing rules Swagger cannot express accurately.
 */
import type { components } from "./generated/restaurant";
import type { ServiceCall, PushDevice, RestaurantIdentity } from "./types";

type IsAssignable<T, U> = [T] extends [U] ? true : false;
type Assert<T extends true> = T;
export type CallWireCompatible = Assert<
  IsAssignable<ServiceCall, components["schemas"]["CallHistoryDto"]>
>;
export type DeviceWireCompatible = Assert<
  IsAssignable<PushDevice, components["schemas"]["PushDeviceDto"]>
>;

export type IdentityWireCompatible = Assert<IsAssignable<RestaurantIdentity, components["schemas"]["AuthenticatedRestaurantIdentityDto"]>>;
