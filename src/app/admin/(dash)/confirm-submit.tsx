"use client";

import type { ReactNode } from "react";

/** Butang submit yang minta pengesahan dulu (untuk padam). */
export function ConfirmSubmit({ message, label, children, className }: { message: string; label: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
