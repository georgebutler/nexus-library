import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { SpatialRuntime } from "@/app/components/SpatialRuntime";
import { WebSpatialProvider } from "@/app/components/WebSpatialProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nexus Library",
    template: "%s · Nexus Library",
  },
  description:
    "An XR-ready spatial game library powered by RAWG and WebSpatial.",
  applicationName: "Nexus Library",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080b12",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <WebSpatialProvider>
          <SpatialRuntime />
          {children}
        </WebSpatialProvider>
      </body>
    </html>
  );
}
