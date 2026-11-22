import { Tabs } from "heroui-native/tabs";
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

/** HeroUI Native controlled tabs; data filtering stays in useEmployeeCalls. */
export function CallsFilter({ value, onChange, disabled = false }: Props) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as CallFilter)} variant="primary">
      <Tabs.List>
        <Tabs.ScrollView horizontal showsHorizontalScrollIndicator={false} scrollAlign="center"
          contentContainerClassName="flex-row-reverse items-center gap-1 px-1">
          <Tabs.Indicator className="rounded-xl bg-primary" />
          {options.map((option) => (
            <Tabs.Trigger key={option.value} value={option.value} isDisabled={disabled}
              accessibilityLabel={option.label} className="min-h-12 rounded-xl px-3">
              <Tabs.Label className="text-center text-sm font-semibold">{option.label}</Tabs.Label>
            </Tabs.Trigger>
          ))}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  );
}
