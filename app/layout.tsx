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
          <header className="border-b" style={{borderColor: 'rgba(122, 64, 255, 0.2)', background: 'rgba(22, 22, 35, 0.95)', backdropFilter: 'blur(15px)'}}>
            <div className="mx-auto flex items-center justify-center px-6 py-4" style={{maxWidth: '100%', gap: '4rem'}}>
              <div className="flex items-center gap-8">
                <Link href="/" className="font-bold tracking-wider uppercase" style={{fontFamily: "'Rajdhani', sans-serif", fontSize: '1.1rem', color: '#ffffff', letterSpacing: '1px'}}>
                  ИГРАТЬ
                </Link>
                <nav className="text-sm flex items-center gap-7" style={{color: '#aaaacc', fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem', fontWeight: 500}}>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    КАБИНЕТ
                  </Link>
                  <Link href="/players" className="hover:text-white transition-colors">
                    ИГРОКИ
                  </Link>
                  <Link href="/stats" className="hover:text-white transition-colors">
                    СТАТИСТИКА
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