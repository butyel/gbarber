import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GBarber - Sistema de Gestão de Barbearia",
  description: "Sistema SaaS completo para gestão de barbearias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${inter.className} h-full`}>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}