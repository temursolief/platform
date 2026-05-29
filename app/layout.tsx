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
    <html lang="en" className="h-full" suppressHydrationWarning>
      {/* Inline script runs before paint — prevents dark-mode flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ielts-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="h-full antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
