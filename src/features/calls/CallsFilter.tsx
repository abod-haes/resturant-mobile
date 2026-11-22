import { Pressable, StyleSheet, Text, View } from "react-native";
import { strings } from "../../shared/config/strings";
import { colorPalettes } from "../../shared/config/palettes";
import { radius, spacing, typeScale, useAppTheme } from "../../shared/config/theme";
import type { CallFilter } from "./model";

type Props = {
  value: CallFilter;
  onChange(next: CallFilter): void;
  disabled?: boolean;
};

const options: readonly { value: CallFilter; label: string }[] = [
  { value: "all", label: strings.allCalls },
  { value: "waiter", label: strings.waiter },
  { value: "hookah", label: strings.hookah },
];

/**
 * Arabic-first filter: first option starts on the right without relying on
 * platform-dependent RTL horizontal ScrollView behavior.
 * Use the deep brand green for white-on-primary contrast in both themes.
 */
export function CallsFilter({ value, onChange, disabled = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.options} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.tab,
              selected && { backgroundColor: colorPalettes.light.primary },
              pressed && !disabled && { opacity: 0.78 },
              disabled && { opacity: 0.5 },
            ]}
          >
            <Text
              allowFontScaling
              style={[styles.label, { color: selected ? "#FFFFFF" : colors.text }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    width: "100%",
    direction: "ltr",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: "transparent",
  },
  tab: {
    minHeight: 48,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  label: {
    fontSize: typeScale.body,
    fontWeight: "700",
    textAlign: "center",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
});
