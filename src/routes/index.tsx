import { createFileRoute, redirect } from "@tanstack/react-router";

import { PersonalMapScreen } from "#components/MapScreen/PersonalMapScreen.tsx";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading || context.auth.isAuthenticated) {
      return;
    }
    throw redirect({ to: "/sign-in", search: { redirectTo: location.href } });
  },
  component: PersonalMapScreen,
});
