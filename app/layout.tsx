import "@/styles/globals.css";
import type { Metadata } from "next";
import { SWRProvider } from "@/lib/swr-config";

export const metadata: Metadata = {
  title: "iCAN Platform",
  description: "Make your in-house team better than agency",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-fg min-h-screen">
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
