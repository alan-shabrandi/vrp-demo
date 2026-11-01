"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: cn(
    "bg-gradient-to-b from-[#5aa5ff] to-[var(--color-route-ga)]",
    "font-semibold tracking-tight text-[#0a0b0f]",
    "shadow-[0_4px_20px_rgba(79,158,255,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]",
    "hover:brightness-110",
    "hover:shadow-[0_6px_28px_rgba(79,158,255,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]",
    "active:translate-y-px",
    "disabled:from-[var(--color-surface-hover)] disabled:to-[var(--color-surface)]",
    "disabled:text-[var(--color-fg-dim)] disabled:shadow-none",
  ),
  secondary: cn(
    "border border-[var(--color-border)] bg-[var(--color-surface)]",
    "text-[var(--color-fg-muted)]",
    "hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]",
    "disabled:opacity-40",
  ),
  ghost: cn(
    "text-[var(--color-fg-muted)]",
    "hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]",
    "disabled:opacity-40",
  ),
  danger: cn(
    "border border-[var(--color-danger)]/35 bg-[var(--color-danger)]/10",
    "text-[var(--color-danger)]",
    "hover:border-[var(--color-danger)]/55 hover:bg-[var(--color-danger)]/20",
    "disabled:opacity-40",
  ),
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "rounded-lg px-3 py-1.5 text-[11px]",
  md: "rounded-xl px-4 py-3 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button until cleared. */
  loading?: boolean;
}

/**
 * Polymorphic-lite button: four visual variants, two sizes, and a
 * loading state that implies `disabled`. `type` defaults to `"button"`
 * to avoid accidental form submission. All other native button props
 * pass through via `...rest`.
 */
export function Button({
  variant = "secondary",
  size = "sm",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-150 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
