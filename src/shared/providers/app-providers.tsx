"use client";
// 앱 전역 Provider를 한곳에서 조립한다. layout은 이 컴포넌트 하나만 감싼다.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // 요청마다 새 인스턴스를 만들되 리렌더 시 재생성되지 않도록 state로 고정한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR에서 서버가 이미 받아온 데이터를 클라이언트가 즉시 다시 요청하지 않도록 한다.
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
