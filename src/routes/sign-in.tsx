import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { mockMap } from "#components/MapScreen/mock-map.ts";
import { SignInScreen } from "#components/SignInScreen/SignInScreen.tsx";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) throw redirect({ to: "/" });
  },
  component: SignInPage,
});

function SignInPage() {
  const { signIn } = useAuthActions();
  const { redirectTo } = Route.useSearch();
  return (
    <SignInScreen
      sectors={mockMap.sectors}
      anchorId={mockMap.anchorId}
      planets={mockMap.planets}
      links={mockMap.links}
      onSignIn={() => signIn("github", redirectTo ? { redirectTo } : undefined)}
    />
  );
}
