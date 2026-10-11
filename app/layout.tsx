import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AIMT — Ambalika Institute of Management and Technology",
    template: "%s | AIMT College Management System",
  },
  description:
    "Official college management portal of Ambalika Institute of Management and Technology, Lucknow, Uttar Pradesh.",
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
