import { createFileRoute, redirect } from "@tanstack/react-router";

import { MapScreen } from "#components/MapScreen/MapScreen.tsx";
import { mockMap } from "#components/MapScreen/mock-map.ts";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading || context.auth.isAuthenticated) {
      return;
    }
    throw redirect({ to: "/sign-in", search: { redirectTo: location.href } });
  },
  component: () => <MapScreen {...mockMap} />,
});
