import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { PwaRuntime } from "@/app/components/PwaRuntime";
import { WebSpatialProvider } from "@/app/components/WebSpatialProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    "An XR-ready spatial game library built with WebSpatial.",
  applicationName: "Nexus Library",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icon-180-maskable.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus Library",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080b12",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <TooltipProvider>
          <WebSpatialProvider>
            <PwaRuntime />
            {children}
          </WebSpatialProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
