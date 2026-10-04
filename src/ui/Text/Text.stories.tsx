import preview from "#storybook/preview";
import { Text } from "#ui";

const meta = preview.meta({ title: "UI/Text", component: Text });

export const Typography = meta.story({
  render: () => (
    <div className="flex max-w-lg flex-col gap-5">
      <Text as="h1" variant="heading">
        Project overview
      </Text>
      <Text variant="label" tone="subtle">
        Details
      </Text>
      <Text as="h2" variant="title">
        Project settings
      </Text>
      <Text as="p">Choose how you want to receive notifications.</Text>
      <Text as="p" variant="caption" tone="muted">
        Changes apply to this project.
      </Text>
      <Text as="p" variant="caption" tone="subtle">
        You can update these settings at any time.
      </Text>
      <Text variant="mono" tone="muted">
        Version 1.2.0
      </Text>
      <Text variant="metric">12</Text>
    </div>
  ),
});
