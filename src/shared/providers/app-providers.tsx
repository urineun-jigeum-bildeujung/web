"use client";
// 앱 전역 Provider를 한곳에서 조립한다. layout은 이 컴포넌트 하나만 감싼다.

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { shouldRetryQuery } from "@/shared/api/client";
import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { Icon } from "@/shared/ui/icon/icon";
import { Toaster } from "@/shared/ui/sonner";
import { Tooltip } from "radix-ui";
import { useState } from "react";

import { PushMessageListener } from "./push-message-listener";
import { SessionExpiryRedirect } from "./session-expiry-redirect";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // 요청마다 새 인스턴스를 만들되 리렌더 시 재생성되지 않도록 state로 고정한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // 변경 실패는 사용자가 방금 누른 행동이 안 먹힌 것이라 반드시 알려야 한다.
        //
        // 이 처리를 defaultOptions.mutations.onError가 아니라 MutationCache에 두는 이유가 있다.
        // defaultOptions 쪽은 호출부가 onError를 주면 통째로 덮여 알림이 조용히 사라진다.
        // 캐시 단위는 호출부 핸들러와 함께 항상 실행된다.
        //
        // 조회(QueryCache) 실패는 여기서 다루지 않는다. 목록이 비면 빈 상태를,
        // 화면이 깨지면 ErrorBoundary를 보여주는 편이 낫고, 배경 refetch까지 토스트를
        // 띄우면 사용자가 하지도 않은 일로 알림이 뜬다. 알림이 필요한 조회는 호출부가 정한다.
        mutationCache: new MutationCache({
          onError: (error) => toastAppError(toAppMessageCode(error), error),
        }),
        defaultOptions: {
          queries: {
            // SSR에서 서버가 이미 받아온 데이터를 클라이언트가 즉시 다시 요청하지 않도록 한다.
            staleTime: 60 * 1000,
            // 4xx는 다시 보내도 같은 답이라 재시도하지 않는다. 5xx·네트워크 오류만 1회.
            retry: shouldRetryQuery,
          },
        },
      }),
  );

  return (
    // NuqsAdapter가 없으면 useQueryState를 쓰는 쪽에서 "requires an adapter"로 터진다.
    // App Router 전용 어댑터라 경로가 nuqs/adapters/next/app이다.
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {/* 재발급까지 실패해 세션이 끝나면 로그인으로 보낸다. 화면마다 두면 빠뜨린 곳이 생긴다 */}
        <SessionExpiryRedirect />
        {/* 탭이 보이는 동안 온 푸시는 서비스 워커가 띄우지 않는다. 여기서 받아 토스트로 알린다(#354) */}
        <PushMessageListener />
        {/* 툴팁은 앱 전체가 한 Provider를 공유해야 열림 상태가 겹치지 않는다 */}
        <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>
        {/* 시안 snackbar(디자인 시스템 `information` 324:5419)에 맞춘다.
            **shadcn 생성 파일은 건드리지 않는다** — `Toaster`가 `{...props}`를 자기 `style`
            뒤에 펼치므로 여기서 덮으면 CLI를 다시 돌려도 살아남는다.

            색은 셋 다 토큰 값과 정확히 같았다 — 기본 `#2A3038`=surface/primary,
            실패 `#FFF0F0`=surface/danger/weak, 성공 `#EBFAF6`=surface/positive/weak. */}
        <Toaster
          position="bottom-center"
          // sonner는 이 값이 없으면 성공·실패도 기본색으로 그린다. 시안이 상태마다 색을 나누므로 켠다
          richColors
          icons={{
            success: <Icon name="notice" className="size-6" />,
            error: <Icon name="notice" className="size-6" />,
            info: <Icon name="notice" className="size-6" />,
          }}
          style={
            {
              "--normal-bg": "var(--surface-primary)",
              "--normal-text": "var(--text-body-inverse)",
              "--normal-border": "transparent",
              "--success-bg": "var(--surface-positive-weak)",
              "--success-text": "var(--text-body-positive-default)",
              "--success-border": "transparent",
              "--error-bg": "var(--surface-danger-weak)",
              "--error-text": "var(--text-body-danger-default)",
              "--error-border": "transparent",
              // 시안 반경은 5px다. 다른 표면(8·12)과 달라 토큰을 쓰지 않는다
              "--border-radius": "5px",
            } as React.CSSProperties
          }
        />
        {/* 개발 빌드에만 포함된다. NODE_ENV가 production이면 자체적으로 아무것도 렌더하지 않는다. */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
