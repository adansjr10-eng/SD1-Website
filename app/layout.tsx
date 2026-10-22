import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "RAIL LAB — Engineering Knowledge Base",
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
