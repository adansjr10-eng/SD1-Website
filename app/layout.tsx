import type { Metadata } from "next";
import "./globals.css";
import { SITE_NAME } from "@/lib/site";
export const metadata: Metadata = {
  title: SITE_NAME,
  applicationName: SITE_NAME,
  description:
    "Passenger rail bearing testers, primary suspension research, and senior design development.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
