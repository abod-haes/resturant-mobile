import { useWindowDimensions } from "react-native";
import { resolveAppLayout } from "./layout";
import type { AppLayout } from "./layout";

/** Runtime-only hook: layout math remains importable by Node unit tests. */
export function useAppLayout(): AppLayout {
  const { width, fontScale } = useWindowDimensions();
  return resolveAppLayout(width, fontScale);
}
