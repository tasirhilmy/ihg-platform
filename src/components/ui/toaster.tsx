"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-500",
          actionButton: "group-[.toast]:bg-brand group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700",
          success: "group-[.toast]:border-l-4 group-[.toast]:border-l-emerald-500",
          error: "group-[.toast]:border-l-4 group-[.toast]:border-l-red-500",
          warning: "group-[.toast]:border-l-4 group-[.toast]:border-l-amber-500",
          info: "group-[.toast]:border-l-4 group-[.toast]:border-l-sky-500",
        },
      }}
    />
  );
}
