import { View, Text, TextInput, StyleSheet } from "react-native";
import type { TextInputProps } from "react-native";
import { radius, spacing, useAppTheme } from "../config/theme";
import { FieldError } from "./FieldError";

type Props = TextInputProps & { label: string; error?: string | null };
export function AppInput({ label, error, style, ...inputProps }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || inputProps.accessibilityHint}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        style={[styles.input, { backgroundColor: colors.input, borderColor: error ? colors.danger : colors.border, color: colors.text }, style]}
        {...inputProps}
      />
      <FieldError message={error} />
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { textAlign: "right", fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
