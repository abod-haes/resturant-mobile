import { Tabs } from "heroui-native/tabs";
import { strings } from "../../shared/config/strings";
import { spacing, typeScale, useAppTheme } from "../../shared/config/theme";
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

/** HeroUI Native tabs with a transparent list and right-to-left Arabic layout. */
export function CallsFilter({ value, onChange, disabled = false }: Props) {
  const { colors, typography } = useAppTheme();

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as CallFilter)}
      variant="primary"
      className="bg-transparent"
    >
      <Tabs.List
        background={null}
        className="bg-transparent border-0"
        style={{
          alignSelf: "flex-end",
          flexDirection: "row-reverse",
          maxWidth: "100%",
          paddingVertical: spacing.xs,
        }}
      >
        <Tabs.Indicator
          className="rounded-xl"
          style={{ backgroundColor: colors.button }}
        />
        {options.map((option) => (
          <Tabs.Trigger
            key={option.value}
            value={option.value}
            isDisabled={disabled}
            accessibilityLabel={option.label}
            className="min-h-12 min-w-0 rounded-xl px-3"
            style={{ flexShrink: 1 }}
          >
            {({ isSelected }) => (
              <Tabs.Label
                className="text-center"
                style={{
                  color: isSelected ? colors.onPrimary : colors.text,
                  fontSize: typeScale.body,
                  ...typography.bold,
                  writingDirection: "rtl",
                  flexShrink: 1,
                }}
              >
                {option.label}
              </Tabs.Label>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
