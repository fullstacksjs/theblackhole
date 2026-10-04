## TheBlackHole UI: how to build with it

A quiet, monochrome console language: near-black or near-white surfaces, 1px hairlines, Inter for prose, and JetBrains Mono for uppercase labels and numbers. There is no accent color. Hierarchy comes from tone (foreground, then muted, subtle and faint), size, and mono labels.

### Setup
- Components live on `window.BlackHoleUI` (`Button`, `Text`, `Stat`, `StatusIndicator`, `Progress`, `Slider`, `Textarea`, `ToastProvider`, `useToast`). Load `styles.css`, which carries the palette, the bundled Inter and JetBrains Mono fonts, and the Tailwind utilities.
- No root provider is needed for styling. The palette follows `prefers-color-scheme` (dark is the design default). To force a theme, set `data-theme="dark"` or `data-theme="light"` on `<html>`. Paint the page with `bg-background text-foreground font-sans`.
- `useToast()` only works under `<ToastProvider>`, so wrap the app once when you show notifications.

### Styling idiom: Tailwind utilities with theme tokens
Use library components for controls and copy, and Tailwind classes for layout glue. Only the classes compiled into `styles.css` exist (no JIT), so stick to this vocabulary:
- Color: `bg-*`, `text-*` and `border-*` combined with `background`, `foreground`, `panel`, `input`, `border`, `divider`, `muted-foreground`, `subtle-foreground`, `faint` (for example `bg-panel`, `border-divider`, `text-muted-foreground`).
- Type scale: `text-label`, `text-caption`, `text-body`, `text-title`; `font-sans`, `font-mono`; `uppercase`, `tracking-widest`, `tabular-nums`.
- Layout: `flex`, `grid`, `flex-col`, `items-*`, `justify-between`, `gap-{1..24}`, `p-*`, `px-*`, `py-*`, `m*-*`, `w-full`, `max-w-{sm..3xl}`, `grid-cols-{1,2,3,4,6,12}`, `absolute`, `fixed`, `inset-0`, `z-{10,20,50}`, `border`, `border-{t,b}`, `backdrop-blur-sm`.
- For anything outside that list, use inline styles with the CSS variables: `var(--background)`, `--foreground`, `--panel`, `--input`, `--border`, `--divider`, `--muted-foreground`, `--subtle-foreground`, `--faint`. Never hard-code hex colors.
- Keep corners square (the system has no rounded corners) and keep lines at 1px.

### Components
- `Text` handles all visible copy. Pick the element with `as`. `variant` is `heading | title | body | caption | label | metric | mono`, and `tone` is `default | muted | subtle | inherit`. Use `label` for small uppercase mono eyebrows and `metric` for big numbers.
- `Button`: `variant` is `primary | secondary | quiet`, `size` is `default | small`, and it also takes `loading` and `disabled`. It defaults to `type="button"`.
- `Stat` (`label` plus numeric `value`), `StatusIndicator` (`label`, `tone`, `variant="solid|dashed"`; the label must state the status, never color alone), `Progress` (`label`, `value`, `max`), `Slider` (`label`, `value`/`defaultValue`, `min`/`max`/`step`), `Textarea` (`label`, `description`, `error`, `hideLabel`). Form controls generate their own ids.

### Where the truth lives
- `styles.css` → `_ds_bundle.css`: every token and utility that exists.
- `components/ui/<Name>/<Name>.prompt.md` and `.d.ts`: per-component API and examples.
- `guidelines/src/ui/README.md`: the design-system rules. `guidelines/examples/isometric-map.html` is a full page in this language: a full-bleed canvas with a HUD of mono eyebrows, hairline progress tracks, and stat counts pinned to the corners. Match its density and restraint.

### Example
```jsx
const { Text, Stat, Progress, Button, StatusIndicator } = window.BlackHoleUI;

<div className="min-h-screen bg-background text-foreground font-sans p-8 flex flex-col gap-8">
  <div className="flex items-start justify-between">
    <div className="flex flex-col gap-1">
      <Text variant="label" tone="subtle">Sector 04</Text>
      <Text as="h1" variant="title">Outer ring</Text>
    </div>
    <div className="flex gap-8">
      <Stat label="Charted" value={12} />
      <Stat label="Fading" value={3} />
    </div>
  </div>
  <div className="max-w-sm flex flex-col gap-4 border border-divider bg-panel p-6">
    <StatusIndicator label="In reach" tone="muted" />
    <Progress label="Sector progress" value={7} max={12} />
    <Button variant="secondary" size="small">Recenter</Button>
  </div>
</div>
```
