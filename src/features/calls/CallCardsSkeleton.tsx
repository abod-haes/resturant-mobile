import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { AppCard } from "../../shared/ui/AppCard";
import { radius, spacing, useAppTheme } from "../../shared/config/theme";
import { strings } from "../../shared/config/strings";

type Props = { count?: number };

const PLACEHOLDERS = [0, 1, 2] as const;

/** Mirrors CallCard geometry without displaying fabricated call data. */
export function CallCardsSkeleton({ count = 3 }: Props) {
  const { skeleton } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={strings.loading} style={styles.list}>
      {PLACEHOLDERS.slice(0, count).map((item) => (
        <AppCard key={item} style={styles.card}>
          <Animated.View style={[styles.placeholderContent, { opacity }]}>
            <View style={styles.header}>
              <View style={[styles.pill, { backgroundColor: skeleton }]} />
              <View style={[styles.heading, { backgroundColor: skeleton }]} />
            </View>
            <View style={[styles.line, styles.mediumLine, { backgroundColor: skeleton }]} />
            <View style={[styles.line, styles.longLine, { backgroundColor: skeleton }]} />
            <View style={[styles.line, styles.shortLine, { backgroundColor: skeleton }]} />
          </Animated.View>
        </AppCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: { gap: spacing.sm },
  placeholderContent: { gap: spacing.md },
  header: {
    flexDirection: "row-reverse", alignItems: "center",
    justifyContent: "space-between", gap: spacing.md,
  },
  pill: { width: 105, height: 34, borderRadius: radius.sm },
  heading: { width: 112, height: 18, borderRadius: radius.sm },
  line: { height: 12, borderRadius: radius.sm, alignSelf: "flex-end" },
  mediumLine: { width: "57%" },
  longLine: { width: "88%" },
  shortLine: { width: "36%" },
});
