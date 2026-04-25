"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  // refetchInterval: 0 отключает постоянный polling — убирает лаги
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
      <Toaster
        position="top-right"
        theme="dark"
        duration={3000}
        style={{
          background: 'rgba(30, 30, 55, 0.95)',
          border: '1px solid rgba(122, 64, 255, 0.3)',
          backdropFilter: 'blur(10px)',
        }}
      />
    </SessionProvider>
  );
}

