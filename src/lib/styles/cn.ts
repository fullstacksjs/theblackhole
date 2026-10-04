import { createCn } from "cn/config";

// Keep custom font sizes when a text color is present in the same class list.
export const cn = createCn({
  extend: {
    classGroups: { "font-size": [{ text: ["body", "caption", "label", "title"] }] },
  },
});
