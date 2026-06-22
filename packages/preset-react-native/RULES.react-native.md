# Rules — React Native extension (R12–R18-RN)

> **Authoritative for:** R12-RN–R18-RN rule extension for React Native projects (Expo and bare RN). Documents both selectable baselines and when to pick each. Base R1–R11 apply to all projects and are described in `RULES.md`.
> **NOT authoritative for:** project goal — see consumer's README.md. Baseline selection wiring — see `install.sh` (multi-stack-install-wiring-iphase task). Expo-vs-bare architecture rationale — see `templates/ARCHITECTURE.react-native.md`.

These rules are enforced at the earliest reachable channel: edit-time ESLint (baseline + shared layer),
pre-push `audit-ai-docs.react-native.sh`, and AI Factory's `rules-sidecar` at `/aif-verify`.

## Choosing a baseline

Two baselines are provided — pick based on your project setup:

| Baseline | Config file | When to use |
|---|---|---|
| **Expo** | `eslint.config.expo.mjs` | Projects using Expo SDK (Expo Router, expo-\*, EAS Build) |
| **Bare RN** | `eslint.config.bare-rn.mjs` | Projects using React Native CLI without Expo |

Both baselines include the **shared RN layer** (`eslint.config.rn-common.mjs`):
- `eslint-plugin-react-native` style/text rules (R14-RN)
- `eslint-plugin-react-native-a11y` mobile a11y rules (R15-RN)
- `no-restricted-globals` web-globals denylist (R12-RN, **mandatory**)

See `templates/ARCHITECTURE.react-native.md` for baseline-selection rationale and the `@callstack` swap note.

---

## R12-RN — Forbid web-only globals (mandatory in shared layer)

**CRITICAL:** `eslint-config-expo/flat` whitelists `window`, `document`, `localStorage` via
`globals.browser` spread — it does NOT forbid them. The `no-restricted-globals` denylist in
`eslint.config.rn-common.mjs` fires **additively** as a separate rule key and catches these
under BOTH baselines.

Globals forbidden in RN code:
- `window` → use `Platform.OS` or platform-specific module
- `document` → use React Native APIs
- `localStorage` → use `@react-native-async-storage/async-storage` or `expo-secure-store`
- `sessionStorage` → use `@react-native-async-storage/async-storage`
- `navigator` → use `react-navigation` navigator prop
- `XMLHttpRequest` → use `fetch()`

**Check:** ESLint `no-restricted-globals` in `eslint.config.rn-common.mjs` (fires under both baselines).

### Examples

```tsx
// BAD — web global in RN component
const stored = localStorage.getItem('user');
if (window.innerWidth > 768) { ... }
```

```tsx
// GOOD — RN-native equivalents
import AsyncStorage from '@react-native-async-storage/async-storage';
const stored = await AsyncStorage.getItem('user');
import { Dimensions } from 'react-native';
if (Dimensions.get('window').width > 768) { ... }
```

## R13-RN — Platform-specific code

- Use `Platform.OS === 'ios' | 'android'` for platform splits (not `window` or `navigator`).
- Platform-specific files use `.ios.ts` / `.android.ts` suffixes.
- No `require()` for platform splits (use `Platform.select()` or suffix convention).

**Check:** Manual review.

## R14-RN — Styles (StyleSheet.create enforcement)

- No inline styles in JSX (`style={{ flex: 1 }}` patterns).
- Use `StyleSheet.create({})` — enforced by `react-native/no-inline-styles`.
- No hardcoded color literals — use theme tokens or `StyleSheet.hairlineWidth`.
- No unused `StyleSheet` entries — detected by `react-native/no-unused-styles`.

**Check:** ESLint `react-native/no-inline-styles`, `react-native/no-color-literals`, `react-native/no-unused-styles` in `eslint.config.rn-common.mjs`.

### Examples

```tsx
// BAD — inline styles
<View style={{ flex: 1, backgroundColor: '#fff' }} />
```

```tsx
// GOOD — StyleSheet.create
const styles = StyleSheet.create({ container: { flex: 1 } });
<View style={styles.container} />
```

## R15-RN — Accessibility (react-native-a11y)

- Use `eslint-plugin-react-native-a11y` (Nearform) — **not** `jsx-a11y` (web ARIA/DOM, wrong problem-class for RN).
- Touchable components have `accessibilityRole` set.
- No nested Touchable elements (gesture conflicts).
- Components that expose user-facing text have an accessibility hint where needed.

**Check:** ESLint `react-native-a11y/*` rules in `eslint.config.rn-common.mjs`.

### Examples

```tsx
// BAD — missing accessibilityRole
<TouchableOpacity onPress={handlePress}>
  <Text>Submit</Text>
</TouchableOpacity>
```

```tsx
// GOOD
<TouchableOpacity onPress={handlePress} accessibilityRole="button" accessibilityLabel="Submit order">
  <Text>Submit</Text>
</TouchableOpacity>
```

## R16-RN — Images and assets

- Use `Image` from `react-native` (not HTML `<img>`).
- All `Image` elements have `accessibilityLabel` or `accessible={false}` (decorative).
- Large images use `resizeMode` and explicit `width`/`height`.

**Check:** Manual review.

## R17-RN — Navigation

- Use React Navigation (`react-navigation`) or Expo Router — no DOM-based router.
- `useNavigation()` hook preferred over direct `navigation` prop drilling.
- Deep links defined in navigation config, not URL hacks.

**Check:** Manual review.

## R18-RN — Performance

- FlatList and SectionList must have `keyExtractor` defined.
- No anonymous functions as `renderItem` (creates new function reference each render).
- Heavy computations in `useMemo` / `useCallback`.
- Images loaded via `FastImage` or equivalent if using remote URLs.

**Note on FlashList:** No upstream ESLint rule exists for enforcing FlashList over FlatList.
A commented, default-off `no-restricted-imports` snippet is available in `eslint.config.rn-common.mjs`
— uncomment if your project has adopted FlashList or LegendList as the standard.

**Check:** Manual review + optional commented snippet in `eslint.config.rn-common.mjs`.

---

## How violations are handled

1. AI Factory's `rules-sidecar` flags violations on `/aif-verify`.
2. `living-docs-auditor` runs `audit-ai-docs.react-native.sh` and reports.
3. `/aif-fix` resolves flagged items.
4. If a rule is genuinely incompatible — `/aif-rules` to discuss update with rationale.

## Adding new project-specific rules

When your project develops project-specific patterns:
1. Add rule R19-RN+ to this file with its automated check.
2. Add corresponding probe to `audit-self/audit-ai-docs.react-native.sh`.
3. Add a **negative test** for the probe — without it, the rule is wishful thinking.
4. Update your edit-time ESLint rule (or AI Factory `rules-sidecar` skill-context) if the check requires AI interpretation.
