import "./Toast.css";
import { Toast } from "@base-ui/react/toast";
import { X } from "lucide-react";

import { Button } from "../Button/Button";
import { Text } from "../Text/Text";

export const useToast = Toast.useToastManager;

function ToastViewport() {
  const { toasts } = useToast();
  return (
    <Toast.Portal>
      <Toast.Viewport className="ui-toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="ui-toast flex items-start gap-3 border border-border bg-panel p-4 backdrop-blur-sm"
          >
            <Toast.Content className="flex min-w-0 flex-1 flex-col gap-1">
              <Toast.Title render={<Text as="h2" variant="caption" tone="muted" />} />
              <Toast.Description render={<Text as="p" variant="caption" tone="subtle" />} />
              {toast.actionProps && (
                <Toast.Action
                  {...toast.actionProps}
                  render={<Button size="small" className="mt-2 self-start" />}
                />
              )}
            </Toast.Content>
            <Toast.Close
              aria-hidden={false}
              aria-label="Dismiss notification"
              className="flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <X aria-hidden="true" className="size-3.5" />
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function ToastProvider({
  children,
  timeout = 2600,
  limit = 3,
  ...props
}: Toast.Provider.Props) {
  return (
    <Toast.Provider {...props} timeout={timeout} limit={limit}>
      {children}
      <ToastViewport />
    </Toast.Provider>
  );
}
