import type { Metadata } from "next";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecordKeep",
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
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}