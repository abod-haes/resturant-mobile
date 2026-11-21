import { Pressable, Text, View, StyleSheet } from "react-native";
import { spacing, radius, typeScale, useAppTheme } from "../../shared/config/theme";
import { layoutTokens } from "../../shared/config/layout";
import { strings } from "../../shared/config/strings";
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

export function CallsFilter({ value, onChange, disabled = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={strings.callsFilterLabel} style={styles.container}>
      {options.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ selected, disabled }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text allowFontScaling style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse", flexWrap: "wrap",
    alignItems: "center", gap: spacing.sm,
  },
  option: {
    minHeight: layoutTokens.minTouchTarget, minWidth: 72, maxWidth: "100%",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  label: { fontSize: typeScale.meta, fontWeight: "700", textAlign: "center", flexShrink: 1 },
});
