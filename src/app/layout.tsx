import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { GITHUB_REPO_URL } from "@/lib/constants";
import "./globals.css";
import "leaflet/dist/leaflet.css";

// JetBrains Mono holds its weight better than Geist Mono at the 9–11px
// sizes this app renders every number at. The CSS variable is named
// `--font-geist-mono` so consumers stay untouched.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // No `metadataBase` until a public deployment URL exists; without one,
  // Next.js falls back to a relative base and social previews still work.
  title: "VRP Genetic Algorithm — Interactive Demo",
  description:
    "An interactive Vehicle Routing Problem solver powered by a genetic algorithm. Tune parameters, watch it evolve, and compare against a nearest-neighbor baseline.",
  applicationName: "VRP Demo",
  keywords: [
    "VRP",
    "genetic algorithm",
    "vehicle routing",
    "optimization",
    "GIS",
    "Leaflet",
  ],
  authors: [
    { name: "Alan Shabrandi", url: "https://github.com/alan-shabrandi" },
  ],
  openGraph: {
    title: "VRP Genetic Algorithm — Interactive Demo",
    description:
      "Interactive genetic-algorithm solver for the Vehicle Routing Problem. Compare against a nearest-neighbor baseline in real time.",
    type: "website",
  },
  other: {
    // Discoverability hint for tools that read <meta name="repository">.
    repository: GITHUB_REPO_URL,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="relative flex min-h-full flex-col">
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
