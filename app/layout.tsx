import type { Metadata, Viewport } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "./providers/vault-provider";
import { PwaUpdate } from "@/components/pwa-update";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});
const scp = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-scp",
});

export const metadata: Metadata = {
  title: "Vault",
  description: "Personal zero-knowledge credential vault",
  appleWebApp: { capable: true, title: "Vault", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${scp.variable}`}>
      <body>
        <VaultProvider>{children}</VaultProvider>
        <PwaUpdate />
      </body>
    </html>
  );
}
