// 화면 일부에서 난 오류를 그 자리에 가두고 다시 시도할 수단을 준다.
// 경쟁사 VOC의 "앱 튕김, 하얀 화면"에 대한 대응이며 시안은 아직 없다.

"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import { Button } from "@/shared/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  /** 오류가 났을 때 그 자리에 보여줄 것. 없으면 기본 안내가 뜬다 */
  fallback?: (retry: () => void) => ReactNode;
};

/**
 * 페이지 최상단이 아니라 섹션 단위로 감싼다.
 * 추천 영역이 실패해도 상품 목록은 그대로 보여야 한다.
 * 라우트 전체의 오류는 Next.js의 error.tsx가 맡는다.
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) =>
            fallback ? (
              fallback(resetErrorBoundary)
            ) : (
              <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  잠시 문제가 생겼어요. 다시 시도해 주세요.
                </p>
                <Button variant="outline" onClick={resetErrorBoundary}>
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
