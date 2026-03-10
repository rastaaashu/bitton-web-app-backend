import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "BitTON.AI",
  description: "BTN Staking & Rewards Platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary>
            <LayoutShell>{children}</LayoutShell>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
