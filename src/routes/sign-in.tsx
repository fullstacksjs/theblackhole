import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  return <div className="" />;
}
