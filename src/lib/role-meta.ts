import type { PointRole } from "./types";

export interface RoleMeta {
  /** Single-character badge (A / • / B). */
  short: string;
  label: string;
  color: string;
  /** Soft background fill. */
  bg: string;
  border: string;
}

export const ROLE_META: Record<PointRole, RoleMeta> = {
  start: {
    short: "A",
    label: "Start",
    color: "var(--color-success)",
    bg: "rgba(61, 255, 162, 0.14)",
    border: "rgba(61, 255, 162, 0.4)",
  },
  stop: {
    short: "•",
    label: "Stop",
    color: "var(--color-route-ga)",
    bg: "rgba(79, 158, 255, 0.14)",
    border: "rgba(79, 158, 255, 0.4)",
  },
  end: {
    short: "B",
    label: "End",
    color: "var(--color-danger)",
    bg: "rgba(255, 74, 107, 0.14)",
    border: "rgba(255, 74, 107, 0.4)",
  },
};

/** Ordered roles for UI iteration. */
export const ROLE_ORDER = [
  "start",
  "stop",
  "end",
] as const satisfies readonly PointRole[];
