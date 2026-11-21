import { View, Text, TextInput, StyleSheet } from "react-native";
import type { TextInputProps } from "react-native";
import { radius, spacing, typeScale, useAppTheme } from "../config/theme";
import { FieldError } from "./FieldError";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  /** Explicit text entry direction; Latin account credentials need LTR carets. */
  textDirection?: "ltr" | "rtl";
};

export function AppInput({ label, error, textDirection = "rtl", style, ...inputProps }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text allowFontScaling style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...inputProps}
        allowFontScaling
        accessibilityLabel={label}
        accessibilityHint={error || inputProps.accessibilityHint}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
            textAlign: textDirection === "ltr" ? "left" : "right",
            writingDirection: textDirection,
          },
          style,
        ]}
      />
      <FieldError message={error} />
    </View>
  );
}
const styles = StyleSheet.create({
  field: { minWidth: 0, gap: spacing.sm },
  label: { textAlign: "right", fontSize: typeScale.meta, fontWeight: "700" },
  input: {
    minWidth: 0, minHeight: 52, borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: typeScale.control,
  },
});
