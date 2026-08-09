import type { Metadata } from "next";
import Link from "next/link";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Record Keep",
  description: "Personal record and document tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AmplifyProvider>
          <div className="page-shell !min-h-0 !pb-0">
            <nav className="flex items-center justify-between border-b border-[var(--line)] pb-5">
              <Link href="/" className="brand">Record Keep</Link>
            </nav>
          </div>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
