"use client";

import * as React from "react";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

export const Toaster = (props: any) => {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      theme="light"
      toastOptions={{
        classNames: {
          toast: "rounded-md border bg-white text-black shadow-md",
          description: "text-sm opacity-90",
          actionButton: "bg-emerald-600 text-white hover:bg-emerald-700",
          cancelButton: "bg-gray-100 text-black hover:bg-gray-200",
        },
      }}
      {...props}
    />
  );
};

export const toast = sonnerToast;
