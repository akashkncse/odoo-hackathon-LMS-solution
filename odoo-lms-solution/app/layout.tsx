import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Solution",
  description:
    "LMS Solution that enables delivery of content in a fun and engaging manner!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`$antialiased`}>
        {children}
        <Toaster richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
