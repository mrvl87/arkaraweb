import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arkara CMS",
  description: "Survival Knowledge Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
