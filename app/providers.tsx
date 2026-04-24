"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // refetchInterval: 0 отключает постоянный polling — убирает лаги
  return <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>{children}</SessionProvider>;
}

