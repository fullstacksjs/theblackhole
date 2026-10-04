import preview from "#storybook/preview";
import { Stat } from "#ui";

const meta = preview.meta({ title: "UI/Stat", component: Stat });
export const Default = meta.story({ args: { label: "Completed", value: 12 } });
