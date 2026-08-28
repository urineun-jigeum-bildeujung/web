"use client";
// 앱 전역 Provider를 한곳에서 조립한다. layout은 이 컴포넌트 하나만 감싼다.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
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

  return (
    // NuqsAdapter가 없으면 useQueryState를 쓰는 쪽에서 "requires an adapter"로 터진다.
    // App Router 전용 어댑터라 경로가 nuqs/adapters/next/app이다.
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* 개발 빌드에만 포함된다. NODE_ENV가 production이면 자체적으로 아무것도 렌더하지 않는다. */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
