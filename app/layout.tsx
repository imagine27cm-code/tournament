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
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{background: 'var(--background)'}}>
        <Providers>
          <header className="border-b" style={{borderColor: 'rgba(0, 240, 255, 0.3)', background: 'rgba(18, 18, 31, 0.9)', backdropFilter: 'blur(10px)'}}>
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <Link href="/" className="font-semibold tracking-tight" style={{fontFamily: "'Orbitron', sans-serif", fontSize: '1.25rem', color: '#00f0ff', textShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff40', letterSpacing: '2px'}}>
                  TOURNEY
                </Link>
                <nav className="text-sm flex items-center gap-3" style={{color: '#8888aa'}}>
                  <Link href="/dashboard" className="cyber-link">
                    Кабинет
                  </Link>
                  <Link href="/players" className="cyber-link">
                    Игроки
                  </Link>
                </nav>
              </div>
              <AuthStatus />
            </div>
          </header>
          <main className="flex-1 pr-64">{children}</main>
          <FriendList />
        </Providers>
      </body>
    </html>
  );
}