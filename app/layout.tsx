import type { Metadata } from "next";
import { Outfit, DM_Sans, Noto_Sans_JP } from "next/font/google"; // [NEW] Import Noto Sans JP
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from 'sonner';

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

// [NEW] Configure Noto Sans JP
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PosterAI - AI搭載ポスター生成ツール",
  description: "Nano Banana Proを使用してプロ品質のポスターを自動生成",
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
    <html lang="ja" suppressHydrationWarning>
      <body className={`${outfit.variable} ${dmSans.variable} ${notoSansJP.variable} font-sans bg-background text-foreground min-h-screen antialiased selection:bg-brand-acid selection:text-brand-black`} suppressHydrationWarning>
        <div className="grain-overlay opacity-50 mix-blend-overlay pointer-events-none z-50" />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
};

