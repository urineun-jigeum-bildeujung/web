// 화면 일부에서 난 오류를 그 자리에 가두고 다시 시도할 수단을 준다.
// 경쟁사 VOC의 "앱 튕김, 하얀 화면"에 대한 대응이며 시안은 아직 없다.

"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import { Button } from "@/shared/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  /**
   * 오류가 났을 때 그 자리에 보여줄 것. 없으면 기본 안내가 뜬다.
   *
   * 넘겨주는 `retry`는 TanStack Query 캐시를 리셋하고 자식을 다시 그리게 할 뿐이다.
   * 일반 Promise를 `use()`로 읽는 화면은 이걸 불러도 아직 같은(이미 reject된)
   * Promise 그대로라 즉시 같은 오류로 재차 잡힌다 — 그런 화면은 `retry`를 부르지
   * 말고 `router.refresh()`로 새 Promise를 받아, 아래 `resetKeys`로 흘려보낸다
   */
  fallback?: (retry: () => void) => ReactNode;
  /**
   * 이 배열의 값이 바뀌면 자동으로 리셋한다(react-error-boundary 표준 동작).
   *
   * TanStack Query가 아니라 일반 Promise를 `use()`로 읽는 화면에서 필요하다 — 그런
   * 화면의 "다시 시도"는 `router.refresh()`로 서버에 새 Promise를 요청하는데, 그건
   * 비동기라 클릭 즉시는 아직 이전(reject된) Promise가 그대로다. 그 순간 `retry`만
   * 부르면 같은 Promise를 다시 읽어 즉시 같은 오류로 재차 잡히고, 그 뒤 새 Promise가
   * 와도 한번 잡힌 경계는 저절로 안 풀린다. 새 Promise 자체를 `resetKeys`로 주면,
   * 그 값이 실제로 바뀌는 순간 자동으로 다시 시도한다
   */
  resetKeys?: unknown[];
};

/**
 * 페이지 최상단이 아니라 섹션 단위로 감싼다.
 * 추천 영역이 실패해도 상품 목록은 그대로 보여야 한다.
 * 라우트 전체의 오류는 Next.js의 error.tsx가 맡는다.
 */
export function ErrorBoundary({ children, fallback, resetKeys }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary
          onReset={reset}
          resetKeys={resetKeys}
          fallbackRender={({ resetErrorBoundary }) =>
            fallback ? (
              fallback(resetErrorBoundary)
            ) : (
              <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  잠시 문제가 생겼어요. 다시 시도해 주세요.
                </p>
                <Button variant="outline" className="min-h-11 px-4" onClick={resetErrorBoundary}>
                  다시 시도
                </Button>
              </div>
            )
          }
        >
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
