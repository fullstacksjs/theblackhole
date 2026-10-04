# design-sync notes

Scope: `src/ui` (the `#ui` design system) only. `src/components` (Map, Planet*, …) are app
compositions and are excluded via `titleMap: null`. `docs/index.html` ships as an example page.

## Build setup
- [GENERAL] The repo is an app with no library build. `.design-sync/ui-build/build.sh` (= `buildCmd`) builds
  `src/ui` as a library: `dist/ui/index.js` + `dist/ui/index.css` (vite lib mode with the Tailwind plugin) and
  `dist/types` (tsc). It also writes a root `index.d.ts` (gitignored) because the converter reads
  `<pkg>/index.d.ts` as the types entry. Run it before the converter on every sync.
- [GENERAL] npm deps must stay external in the lib build. If they're inlined, CJS deps keep `require("react")` →
  "Dynamic require of react is not supported" and every preview is blank.
- [GENERAL] `ui-build/styles.css` = `src/styles.css` + `@source inline(...)` safelist of the token utilities
  the design agent may use (designs are not scanned by Tailwind). Keep it in sync with `conventions.md`.
- Fonts (Inter / JetBrains Mono via @fontsource-variable) ship as data-URI `@font-face` inside `_ds_bundle.css`.
- Use `pnpm exec` (not `npx`): npm refuses to run under the repo's pnpm `devEngines`.
  Reference build: `pnpm exec storybook build -c .storybook -o "$PWD/.design-sync/sb-reference"`.

## Story compilation
- [GENERAL] Stories are CSF Next (`preview.meta()` / `meta.story()`). `.design-sync/overrides/story-imports.mjs`
  (fork, declared in `libOverrides`) redirects `.storybook/preview.tsx` to `.design-sync/storybook-preview-shim.ts`,
  which flattens stories into CSF3 objects. Without it every preview throws `reading 'mock'` (from `sb.mock`).
- [GENERAL] `#ui` resolves to `src/ui/index.ts`, which isn't the converter's `src/index.*` barrel →
  `storyImports.shim: ["src/ui/index.ts"]` so stories render the shipped bundle.
- `! preview decorator bundle failed (.woff2)` is expected and harmless: the only decorator toggles
  `data-theme`, and previews follow `prefers-color-scheme` exactly like Storybook's default "system" theme.
- Story title "Status indicator" → `titleMap.Statusindicator`; "Toast" → `ToastProvider`.

## Upload
- `docs/index.html` → `guidelines/examples/isometric-map.html`. The converter copies only .md guidelines,
  so run `.design-sync/add-example-page.sh` after EVERY package-build/resync and before uploading.

## Known warnings (triaged)
- `[RENDER_THIN] ToastProvider: variants render identically`: both stories show only the trigger button;
  the toast opens in `play()`, which previews don't run. Matches the Storybook capture.

## Re-sync risks
- Grades for Textarea (Default, Multiple Fields), Slider (Scale) and Button (Primary) were accepted despite
  play()-driven state on the Storybook side (typed text, keyboard nudge, focus ring). If play() changes, re-check.
- The CSF Next shim mirrors only `args/render/component/decorators/parameters`. New Storybook APIs used in
  stories (e.g. `.extend`, loaders, beforeEach) may need shim updates.
- The safelist in `ui-build/styles.css` and the vocabulary in `conventions.md` must move together.
- The example page loads three.js from cdn.jsdelivr.net and Google Fonts at runtime.
- Toolchain at first sync: node 24.21, pnpm 12.9.1, storybook (tanstack-react), tailwindcss 4.3.3, typescript 7.0.2.
