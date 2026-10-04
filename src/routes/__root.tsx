import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import type { RouterContext } from "../router-context";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => {
    return null;
  },
});

function RootComponent() {
  return <Outlet />;
}
