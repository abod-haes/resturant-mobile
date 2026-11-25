# Restaurant theme contract v1.0.0 (P1)

Canonical implementation: retuarant-dash/packages/ui/src/restaurant-theme.ts.
Mirrors: resturant-mobile/src/shared/config/restaurant-theme.ts and resturant-customer/src/shared/theme/restaurant-theme.ts. Keep the source byte-identical; update all three together and increment THEME_CONTRACT_VERSION when rules change. No external dependencies or changes to the existing UI in P1.

Inputs: nullable six-digit HEX primaryColor/secondaryColor and cairo/system fontFamily, mode light/dark. Missing or malformed colors independently fall back to platform branding. Raw primary/secondary remain intact (uppercase normalization).

Use primaryStrong for filled actions, tables, selected tabs and sidebar, paired with onPrimary (white); raw primary paired with onPrimaryRaw. Strong uses the first blend toward black meeting 4.5:1 against white. Hover/pressed darken it by 8%/16%. Soft backgrounds blend neutral surface with primary/secondary. Use onPrimarySoft on primarySoft, primaryText/secondaryText on surface, focus for non-text indicators (3:1 against surface). Functional status tokens remain independent of branding. Theme mode changes neutrals and soft colors, not stored branding. Font token maps to native/web font families in consumer adapters.

P2-P4 integrate this engine into authenticated and public UI providers; P5 adds admin preview. Do not override global platform/admin colors. Cache identity by tenant ID; clear on logout. P1 does not change login or live appearance.
