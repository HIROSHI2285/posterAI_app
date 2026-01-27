import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from 'sonner';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PosterAI - AI搭載ポスター生成ツール",
  description: "Google Gemini AIを使用してプロ品質のポスターを自動生成",
  keywords: ["AI", "poster", "generator", "design", "event", "social media"],
  authors: [{ name: "PosterAI" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "PosterAI - AI Poster Generator",
    description: "Create professional posters with AI in seconds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}

