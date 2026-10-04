import { valibotResolver } from "@hookform/resolvers/valibot";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";
import * as v from "valibot";

import preview from "#storybook/preview";
import { Button, Text, Textarea } from "#ui";

import { PlanetStatusIndicator } from "../PlanetStatusIndicator/PlanetStatusIndicator";
import { PlanetPanel } from "./PlanetPanel";

const definition =
  "Keeping copies of data on several machines so the system survives losing any one of them.";
const meta = preview.meta({
  title: "Components/Planet panel",
  component: PlanetPanel,
  parameters: { layout: "padded", chromatic: { viewports: [390, 1280] } },
  args: {
    title: "Replication",
    eyebrow: "Distributed systems",
    status: <PlanetStatusIndicator status="charted" />,
    description: "Linked to The Craft and Backpressure",
    children: (
      <>
        <Text as="p">{definition}</Text>
        <Text as="p" variant="caption" tone="subtle">
          Ready for extra practice.
        </Text>
      </>
    ),
    actions: (
      <>
        <Button>Practice</Button>
        <Button variant="quiet">Close</Button>
      </>
    ),
  },
});
export const Charted = meta.story({});
export const Fading = meta.story({
  args: {
    status: <PlanetStatusIndicator status="fading" />,
    description: "Connections are broken until retention returns.",
    children: (
      <>
        <Text as="p">{definition}</Text>
        <Text as="p" variant="caption" tone="subtle">
          Review this concept to recover its retention.
        </Text>
      </>
    ),
    actions: (
      <>
        <Button variant="primary">Review</Button>
        <Button variant="quiet">Close</Button>
      </>
    ),
  },
});
export const TheCraft = meta.story({
  args: {
    title: "The Craft",
    eyebrow: "Origin",
    status: <PlanetStatusIndicator status="anchor" />,
    description: "The permanent starting anchor of your personal map.",
    children: <Text as="p">Pick an In reach concept to explore your map.</Text>,
    actions: <Button>Close</Button>,
  },
});

const answerSchema = v.object({
  answer: v.pipe(v.string(), v.trim(), v.minLength(1, "Write an explanation before submitting.")),
});

function RecallPanel({ onSubmit }: { onSubmit: (answer: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<v.InferInput<typeof answerSchema>>({
    resolver: valibotResolver(answerSchema),
    defaultValues: { answer: "" },
  });
  return (
    <form
      onSubmit={handleSubmit(({ answer }) => {
        onSubmit(answer);
        setSubmitted(true);
      })}
      noValidate
    >
      <PlanetPanel
        title="Replication"
        eyebrow="Distributed systems"
        status={<PlanetStatusIndicator status="in-reach" />}
        description="In reach via The Craft"
        actions={
          <>
            <Button variant="primary" type="submit">
              Submit answer
            </Button>
            <Button>Not now</Button>
          </>
        }
      >
        <Textarea
          {...register("answer")}
          label="Your explanation"
          hideLabel
          placeholder="Explain it from memory…"
          error={errors.answer?.message}
        />
        {submitted && (
          <Text as="output" variant="caption">
            Answer submitted.
          </Text>
        )}
      </PlanetPanel>
    </form>
  );
}

export const Recall = meta.story({
  render: () => <RecallPanel onSubmit={() => {}} />,
});
const submitAnswer = fn();
export const AnswerValidation = meta.story({
  render: () => <RecallPanel onSubmit={submitAnswer} />,
  beforeEach: () => {
    submitAnswer.mockClear();
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Your explanation" });
    await userEvent.type(input, "   ");
    await userEvent.click(canvas.getByRole("button", { name: "Submit answer" }));
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(submitAnswer).not.toHaveBeenCalled();
    await userEvent.clear(input);
    await userEvent.type(input, "  Keeping copies on several machines.  ");
    await userEvent.click(canvas.getByRole("button", { name: "Submit answer" }));
    await expect(submitAnswer).toHaveBeenCalledWith("Keeping copies on several machines.");
    await expect(canvas.getByRole("status")).toHaveTextContent("Answer submitted.");
    await expect(input).toHaveValue("  Keeping copies on several machines.  ");
  },
});
export const LearningOpportunity = meta.story({
  args: {
    status: <PlanetStatusIndicator status="in-reach" />,
    description: "In reach via The Craft",
    children: (
      <>
        <Text as="p">{definition}</Text>
        <Text as="p" variant="caption" tone="muted">
          For example, a database replica can take over when the primary machine fails.
        </Text>
        <Text
          as="a"
          href="https://en.wikipedia.org/wiki/Replication_(computing)"
          variant="caption"
          className="underline underline-offset-4"
        >
          Further reading
        </Text>
      </>
    ),
    actions: (
      <>
        <Button variant="primary">Try again</Button>
        <Button>Close</Button>
      </>
    ),
  },
});
export const Result = meta.story({
  args: {
    children: (
      <>
        <Text as="h3" variant="heading">
          Recall confirmed
        </Text>
        <Text as="p" variant="caption" tone="muted">
          Replication is Charted. Its neighboring concepts are now In reach.
        </Text>
      </>
    ),
    actions: <Button variant="primary">Back to map</Button>,
  },
});
export const GradingUnavailable = meta.story({
  args: {
    children: (
      <>
        <Text as="output">We could not check your answer. Your explanation is saved.</Text>
        <Textarea label="Your explanation" defaultValue="Keeping copies on several machines." />
      </>
    ),
    actions: (
      <>
        <Button variant="primary">Retry</Button>
        <Button>Close</Button>
      </>
    ),
  },
});
