import "./SignInScreen.css";
import { useEffect, useId, useRef, useState } from "react";

import type { Link, PlanetStatus } from "#domain/map.ts";

import { Button, Stat, StatusIndicator, Text } from "#ui";

import { FIELD_DISTANCE } from "../SpaceMap/arrival";
import { IsoMap, type IsoMapPlanet } from "../SpaceMap/IsoMap";

export interface SignInScreenProps {
  sectors: readonly string[];
  anchorId: string;
  planets: readonly IsoMapPlanet[];
  links: readonly Link[];
  /** Starts the GitHub sign-in, which leaves the page. */
  onSignIn: () => Promise<unknown>;
}

export function SignInScreen({ sectors, anchorId, planets, links, onSignIn }: SignInScreenProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string>();
  const headingId = useId();
  const sectorCount = sectors.length;
  const uncharted = planets.filter((p) => p.id !== anchorId).length;

  // Before sign-in there is no personal map: the whole field stays fogged.
  useEffect(() => {
    const map = new IsoMap(stageRef.current!, { planets, links, sectorCount, onPick: () => {} });
    map.setStatus(
      Object.fromEntries(planets.map((p) => [p.id, "uncharted" as PlanetStatus])),
      null,
    );
    map.setZoom(FIELD_DISTANCE, { instant: true });
    return () => map.dispose();
  }, [planets, links, sectorCount]);

  const signIn = () => {
    setError(undefined);
    setRedirecting(true);
    onSignIn().catch(() => {
      setRedirecting(false);
      setError("GitHub could not be reached. Try again.");
    });
  };

  return (
    <main className="dark-palette relative h-dvh overflow-hidden bg-background text-foreground">
      <div ref={stageRef} aria-hidden="true" className="absolute inset-0" />
      <div aria-hidden="true" className="sign-in-vignette pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-6 p-6 md:px-8 md:pt-7">
        <div className="flex flex-col gap-1.5">
          <Text as="h1" variant="title">
            TheBlackHole
          </Text>
          <Text variant="label" tone="subtle">
            Uncharted field · no origin
          </Text>
        </div>
        <StatusIndicator label="Field fogged" tone="muted" className="bg-background px-2 py-1" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
        <section
          aria-labelledby={headingId}
          className="pointer-events-auto flex w-full max-w-105 flex-col gap-5 border border-divider bg-panel px-7 py-7.5 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-1.75">
            <Text variant="label" tone="subtle">
              Access
            </Text>
            <Text as="h2" id={headingId} variant="title">
              Sign in
            </Text>
            <Text as="p" variant="caption" tone="muted">
              The field is uncharted. Signing in collapses your first origin — everything else stays
              fogged until you chart it.
            </Text>
          </div>
          <Button variant="primary" className="w-full" loading={redirecting} onClick={signIn}>
            <span className="inline-flex items-center gap-2.5">
              <GitHubMark />
              Continue with GitHub
            </span>
          </Button>
          {error && (
            <Text as="p" role="alert" variant="caption">
              {error}
            </Text>
          )}
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 md:px-8 md:pb-7.5">
        <div className="flex gap-10">
          <Stat label="Charted" value={0} />
          <Stat label="Uncharted" value={uncharted} />
        </div>
        <Text
          as="output"
          variant="label"
          tone="subtle"
          className="block lg:absolute lg:inset-x-0 lg:bottom-8.5 lg:text-center"
        >
          {redirecting
            ? "Do not close this window"
            : "Access is granted per-chart · read-only scopes only"}
        </Text>
      </div>
    </main>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="size-4">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
