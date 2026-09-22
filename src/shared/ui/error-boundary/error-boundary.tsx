// 화면 일부에서 난 오류를 그 자리에 가두고 다시 시도할 수단을 준다.
// 경쟁사 VOC의 "앱 튕김, 하얀 화면"에 대한 대응이며 시안은 아직 없다.

"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import { Button } from "@/shared/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** 오류 UI. 인자는 오류 경계를 리셋하고 자식을 다시 그리게 한다(Query 캐시 리셋 포함).
   *  없으면 기본 안내가 뜬다. 일반 Promise를 `use()`로 읽는 화면(Query가 아닌 곳)은
   *  이 함수를 불러도 아직 같은 Promise 그대로라 즉시 재차 잡힌다 — 그런 화면은 이걸
   *  부르지 말고 아래 `resetKeys`를 쓴다 */
  fallback?: (resetBoundary: () => void) => ReactNode;
  /** 값이 바뀌면 오류 경계를 자동으로 리셋한다(react-error-boundary 표준 동작).
   *  일반 Promise를 `use()`로 읽는 화면에서 새로 받은 Promise 자체를 여기 주면 쓸 수 있다 */
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
