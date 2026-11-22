import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { strings } from "../../shared/config/strings";
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

/** Transparent filter row; the selected pill uses the app's shared brand colors. */
export function CallsFilter({ value, onChange, disabled = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.options}
        accessibilityRole="tablist"
      >
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
                selected && { backgroundColor: colors.primary },
                pressed && !disabled && { opacity: 0.78 },
                disabled && { opacity: 0.5 },
              ]}
            >
              <Text
                allowFontScaling
                style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "transparent" },
  options: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
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
    includeFontPadding: false,
  },
});
