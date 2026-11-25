import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { strings } from "../config/strings";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import type { TextInputProps } from "react-native";
import { radius, spacing, typeScale, useAppTheme, typography } from "../config/theme";
import { FieldError } from "./FieldError";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  /** Explicit text entry direction; Latin account credentials need LTR carets. */
  textDirection?: "ltr" | "rtl";
};

export function AppInput({ label, error, textDirection = "rtl", style, ...inputProps }: Props) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const password = Boolean(inputProps.secureTextEntry);
  return (
    <View style={styles.field}>
      <Text allowFontScaling style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputWrap}>
      <TextInput
        {...inputProps}
        secureTextEntry={password && !visible}
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
          password && { paddingLeft: 52 },
          style,
        ]}
      />
      {password && (
        <Pressable accessibilityRole="button" accessibilityLabel={visible ? strings.hidePassword : strings.showPassword} onPress={() => setVisible((current) => !current)} style={styles.eye}>
          {visible ? <EyeOff size={22} color={colors.muted} /> : <Eye size={22} color={colors.muted} />}
        </Pressable>
      )}
      </View>
      <FieldError message={error} />
    </View>
  );
}
const styles = StyleSheet.create({
  inputWrap: { position: "relative", direction: "ltr" },
  eye: { position: "absolute", left: 0, top: 0, bottom: 0, width: 48, alignItems: "center", justifyContent: "center" },
  field: { minWidth: 0, gap: spacing.sm },
  label: { textAlign: "right", fontSize: typeScale.meta, fontFamily: typography.bold },
  input: {
    minWidth: 0, minHeight: 52, borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: typeScale.control, fontFamily: typography.regular,
  },
});
