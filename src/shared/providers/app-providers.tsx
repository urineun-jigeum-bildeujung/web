"use client";
// 앱 전역 Provider를 한곳에서 조립한다. layout은 이 컴포넌트 하나만 감싼다.

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { createQueryClient } from "@/shared/lib/query-client";
import { Icon } from "@/shared/ui/icon/icon";
import { Toaster } from "@/shared/ui/sonner";
import { Tooltip } from "radix-ui";
import { useState } from "react";

import { PushMessageListener } from "./push-message-listener";
import { SessionExpiryRedirect } from "./session-expiry-redirect";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // 요청마다 새 인스턴스를 만들되 리렌더 시 재생성되지 않도록 state로 고정한다.
  // 변경 실패 토스트를 띄우는 MutationCache는 `createQueryClient` 안에 있다 — 테스트 wrapper와 같은 것이다
  const [queryClient] = useState(() => createQueryClient());

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
              // sonner는 자기 글꼴 스택(ui-sans-serif, system-ui …)을 쓴다. 페이지와 같은 Pretendard로 맞춘다.
              // 시스템 글꼴에 맡기면 한글 글리프가 없는 환경(iOS 시뮬레이터 웹뷰)에서 토스트만 깨진다
              fontFamily: "var(--font-sans)",
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
