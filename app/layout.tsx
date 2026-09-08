import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValoCase Demo - Fun-Money Skin Cases",
  description: "Unofficial fan-made fun-money Valorant case-opening demo. No real currency, no real accounts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
