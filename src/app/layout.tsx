import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SWRegistration } from "@/components/pwa/sw-registration";

export const metadata: Metadata = {
  title: "GBarber - Sistema de Gestão de Barbearia",
  description: "Sistema SaaS completo para gestão de barbearias",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GBarber",
  },
  applicationName: "GBarber",
};

export const viewport: Viewport = {
  themeColor: "#1A2E21",
  width: "device-width",
  initialScale: 1,
  maximumScale: 2,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="h-full font-sans">
        <Providers>
          <SWRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}