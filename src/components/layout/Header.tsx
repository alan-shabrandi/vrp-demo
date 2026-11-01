"use client";

import { GITHUB_REPO_URL } from "@/lib/constants";
import { StatusPill, type StatusPillProps } from "./StatusPill";

type HeaderProps = StatusPillProps;

/** Fixed top bar: logo, title, status pill, GitHub source link. */
export default function Header({
  ready,
  loading,
  hasResult,
  stopCount,
  improvement,
}: HeaderProps) {
  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-bg-elevated/70 px-4 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Logo />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[13px] font-semibold tracking-tight text-fg">
            VRP Solver
          </h1>
          <p className="truncate font-mono text-[10px] leading-tight text-fg-muted">
            Genetic Algorithm · Interactive Demo
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusPill
          ready={ready}
          loading={loading}
          hasResult={hasResult}
          stopCount={stopCount}
          improvement={improvement}
        />
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
          className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg focus-visible:bg-surface-hover"
        >
          <GitHubIcon />
        </a>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-route-ga to-[#7bbaff] shadow-[0_0_24px_rgba(79,158,255,0.45)]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0a0b0f"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M8 6h6a4 4 0 0 1 4 4v6" />
      </svg>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.55v-2.13c-3.2.69-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.07 11.07 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.18c0 .3.2.66.8.55C20.71 21.4 24 17.09 24 12c0-6.27-5.23-11.5-11.5-11.5z" />
    </svg>
  );
}
