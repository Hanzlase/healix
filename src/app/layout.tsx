import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healix | Autonomous CI/CD Self-Healing",
  description: "Detect, analyze, and fix CI/CD failures automatically with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
