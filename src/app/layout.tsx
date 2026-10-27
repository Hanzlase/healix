import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healix | Autonomous CI/CD Self-Healing Engine",
  description: "Intercepts broken CI/CD pipelines, diagnoses root causes, and opens verified fix Pull Requests automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5F4EF] text-[#20221F]">
        {children}
      </body>
    </html>
  );
}
