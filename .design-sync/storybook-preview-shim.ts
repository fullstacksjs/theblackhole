// Stand-in for `#storybook/preview` when design-sync compiles story modules.
// The real preview uses CSF Next (`preview.meta()` / `meta.story()`) and calls
// `sb.mock`, neither of which exists outside Storybook. This flattens each
// story into the CSF3 shape the generated preview wrappers compose: meta and
// story args, render, component, and decorators merged onto the story object.
// Global styles ship through the design-sync bundle, so nothing is imported here.
type Annotations = {
  args?: Record<string, unknown>;
  render?: unknown;
  component?: unknown;
  decorators?: unknown[] | unknown;
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
};

const list = (d: unknown) => (d == null ? [] : Array.isArray(d) ? d : [d]);

const preview = {
  meta(meta: Annotations) {
    return {
      ...meta,
      story(story: Annotations = {}) {
        return {
          ...story,
          component: story.component ?? meta.component,
          render: story.render ?? meta.render,
          args: { ...meta.args, ...story.args },
          parameters: { ...meta.parameters, ...story.parameters },
          decorators: [...list(story.decorators), ...list(meta.decorators)],
        };
      },
    };
  },
};

export default preview;
