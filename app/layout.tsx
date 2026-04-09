import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Pro — Practice Platform",
  description: "Prepare for IELTS Listening and Reading with authentic timed tests, automatic scoring, and detailed progress tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-white text-neutral-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
