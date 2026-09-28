// 주문 목록의 맨 아래. 끝이 보이면 다음 쪽을 부르고, 받는 동안 뼈대를, 다음 쪽만 실패하면 다시 시도를 보인다.
// 두 탭(주문내역·취소·반품·교환)이 같은 주문 목록을 쪽으로 받아 함께 쓴다 (#462).

"use client";

import { Button } from "@/shared/ui/button";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";

import { useLoadMore } from "@/shared/lib/list/use-load-more";

import { OrdersSkeleton } from "./orders-skeleton";

type LoadMoreFooterProps = {
  hasNext: boolean;
  loadNext: () => void;
  isLoadingNext: boolean;
  /** 다음 쪽만 실패한 경우. 이미 받은 주문은 그대로 둔다 */
  nextError: boolean;
};

export function LoadMoreFooter({
  hasNext,
  loadNext,
  isLoadingNext,
  nextError,
}: LoadMoreFooterProps) {
  // 목록 끝이 보이면 다음 쪽을 가져온다. 가져오는 중이거나 방금 실패했으면 멈춘다 —
  // 실패한 채로 계속 보고 있으면 같은 요청이 끝없이 다시 나간다
  const loadMoreRef = useLoadMore(loadNext, hasNext && !isLoadingNext && !nextError);

  return (
    <>
      {/* 이 줄이 화면에 들어오면 다음 쪽을 부른다. 보이는 것은 없어 높이만 1px이다.
          **거른 뒤 남는 것이 없어도 선다** — 한 쪽이 통째로 걸러지면 목록이 비어 이 줄이 바로
          보이고, 다음 쪽을 이어 받는다 */}
      {hasNext && !nextError && <div ref={loadMoreRef} aria-hidden className="h-px" />}
      {isLoadingNext && <OrdersSkeleton count={1} className="pt-4" />}

      {/* 다음 쪽만 실패한 경우다. 저절로 다시 부르면 같은 실패가 되풀이되므로 사용자가 고른다.
          **다시 받는 동안에도 오류 상태가 남아 이 버튼이 서 있다.** 잠그지 않으면 또 눌러 같은
          커서로 요청이 한 번 더 나간다. 리뷰 목록의 다시 시도와 같이 대기를 보인다 (#427) */}
      {nextError && (
        <Button
          variant="secondary"
          className="mt-4 h-10 text-label-bold-14"
          disabled={isLoadingNext}
          onClick={() => loadNext()}
        >
          <LoadingSwap loading={isLoadingNext} label="주문을 더 불러오는 중">
            주문을 더 불러오지 못했어요. 다시 시도
          </LoadingSwap>
        </Button>
      )}
    </>
  );
}
