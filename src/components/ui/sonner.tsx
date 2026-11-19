"use client";

// Sonner toasts, restyled to the brand: square, ink border, mono labels, flag colors for state.
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    position="bottom-right"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-bo-green" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4 text-ink" />,
      error: <OctagonXIcon className="size-4 text-bo-red" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    toastOptions={{
      classNames: {
        toast: "!rounded-none !border !border-ink !bg-white !text-ink !shadow-[4px_4px_0_0_var(--color-ink)] font-sans",
        description: "!text-ink/60",
        actionButton: "!rounded-none !bg-ink !text-white",
        cancelButton: "!rounded-none",
      },
    }}
    style={
      {
        "--normal-bg": "#fff",
        "--normal-text": "var(--color-ink)",
        "--normal-border": "var(--color-ink)",
        "--border-radius": "0px",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { Toaster };
