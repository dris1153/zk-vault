import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "./providers/vault-provider";
import { PwaUpdate } from "@/components/pwa-update";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ZKVault",
  description: "Personal zero-knowledge credential vault",
  appleWebApp: { capable: true, title: "ZKVault", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fffdf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        <VaultProvider>{children}</VaultProvider>
        <PwaUpdate />
      </body>
    </html>
  );
}
