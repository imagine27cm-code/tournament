import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";
import { FriendList } from "@/components/FriendList";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tourney RR BO3",
  description: "Round-robin tournaments with BO3 map bans",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col" style={{background: 'var(--background)'}}>
        <Providers>
          <header className="border-b" style={{borderColor: '#1E2A25', background: '#0B0F0D', backdropFilter: 'blur(15px)'}}>
            <div className="mx-auto flex items-center justify-between px-6 py-4" style={{maxWidth: '100%'}}>
              <div className="flex items-center gap-10">
                <Link href="/" className="font-black tracking-wider uppercase" style={{fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: '#A6FF00', letterSpacing: '2px', textShadow: '0 0 20px rgba(166, 255, 0, 0.3)'}}>
                  WARFACE
                </Link>
                 <nav className="text-sm flex items-center gap-8" style={{color: '#8E9A94', fontFamily: "'Exo 2', sans-serif", fontSize: '1rem', fontWeight: 600}}>
                    <Link href="/" className="hover:text-white transition-colors">
                      ИГРАТЬ
                    </Link>
                    <Link href="/dashboard" className="hover:text-white transition-colors">
                      КАБИНЕТ
                    </Link>
                    <Link href="/players" className="hover:text-white transition-colors">
                      ИГРОКИ
                    </Link>
                    <Link href="/stats" className="hover:text-white transition-colors">
                      СТАТИСТИКА
                    </Link>
                    <Link href="/shop" className="hover:text-white transition-colors">
                      МАГАЗИН
                    </Link>
                  </nav>
              </div>
              <div className="flex items-center gap-5">
                <AuthStatus />
              </div>
            </div>
          </header>
          <main className="flex-1 pr-64">{children}</main>
          <FriendList />
        </Providers>
      </body>
    </html>
  );
}