import { View, Text, TextInput, StyleSheet } from "react-native";
import type { TextInputProps } from "react-native";
import { radius, spacing, useAppTheme } from "../config/theme";

type Props = TextInputProps & { label: string };
export function AppInput({ label, style, ...inputProps }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }, style]}
        {...inputProps}
      />
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
