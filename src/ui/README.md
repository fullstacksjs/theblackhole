# Design system

Import general components and their prop types from `#ui`. Components in this
directory must work without knowledge of concepts, planets, sectors, retention,
or other application rules. Their stories use application-neutral examples.

The global `src/styles.css` supplies the fonts, palette, and control styles.
Fonts are bundled locally.

Each component has its own directory, for example `Button/Button.tsx` and
`Button/Button.stories.tsx`. Dedicated stylesheets also live in the component
directory. Keep the public exports in `src/ui/index.ts`.

| Component                   | Options                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Text`                      | Heading, title, body, caption, label, metric, mono; default, muted, subtle, or inherited tone              |
| `Button`                    | Primary, secondary, quiet; default or small size; disabled and loading states                              |
| `Stat`                      | Numeric value and a label slot                                                                             |
| `StatusIndicator`           | Label, solid or dashed dot; default, muted, subtle, or faint indicator tone                                |
| `Progress`                  | Labeled value, optional maximum, percentage display                                                        |
| `Slider`                    | Controlled or uncontrolled numeric value, bounds, step, custom value formatter                             |
| `Textarea`                  | Label, description, error, optional visually hidden label; compatible with `register` from react-hook-form |
| `ToastProvider`, `useToast` | Announcements, dismissal, optional action, automatic timeout paused during interaction                     |

Use `Text` for visible copy and choose `as` for the appropriate HTML element.
`StatusIndicator` keeps its label muted; its `tone` changes the decorative dot.
Supply a label that communicates the state without relying on color alone.
Buttons default to `type="button"`; set `type="submit"` inside a form.
Form controls generate their own IDs. Use the supplied label instead of assigning
an external ID. Manage forms with react-hook-form and validate them with Valibot.

```tsx
import { Button, ToastProvider, useToast } from "#ui";

function SaveButton() {
  const toast = useToast();
  return <Button onClick={() => toast.add({ title: "Changes saved" })}>Save changes</Button>;
}

<ToastProvider>
  <SaveButton />
</ToastProvider>;
```

The palette follows the system preference. Set `data-theme="dark"` or
`data-theme="light"` on the document element to override it. Storybook provides
the same theme switch. Every story runs in both themes, including interaction
and accessibility checks, through `vp test --run --project=storybook`.

Application-specific components and compositions belong in
[`src/components`](../components/README.md). They import general controls from
`#ui`; the design system must not import application components or domain types.

Run `vp run storybook` to browse the general components under `UI` and the
application components under `Components`.
