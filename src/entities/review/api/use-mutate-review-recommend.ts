// 리뷰 도움돼요를 켜고 끄는 훅. 누르는 즉시 수와 눌림을 바꾸고, 실패하면 되돌린다 (#606). 화면은 `useMutation`을 직접 부르지 않는다.

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { toggleReviewRecommend, type ProductReviewPage, type ReviewDetail } from "./reviews";

/** 진행 중인 도움돼요 요청을 센다. 마지막 요청이 끝났을 때만 재동기화한다 */
const MUTATION_KEY = [...QUERY_KEYS.review.all, "recommend"] as const;

type RecommendVariables = {
  reviewId: string;
  /** 누른 뒤의 상태. 화면에 보이던 눌림을 뒤집은 값이다 */
  liked: boolean;
};

/** 눌림을 `liked`로 맞추고 수를 하나 올리거나 내린다. 이미 그 상태면 그대로 둔다 */
function applyLiked<T extends { likeCount: number; liked: boolean }>(item: T, liked: boolean): T {
  if (item.liked === liked) return item;
  return { ...item, liked, likeCount: Math.max(0, item.likeCount + (liked ? 1 : -1)) };
}

/**
 * 후기 목록 캐시인가. `byProductAll` 아래에는 사진·대표 사진 캐시도 함께 있어 모양으로 가린다 —
 * 그 둘은 후기 줄(`reviews`)이 없다
 */
function isReviewPages(data: unknown): data is InfiniteData<ProductReviewPage> {
  return (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    Array.isArray(data.pages) &&
    data.pages.every((page) => Array.isArray(page?.reviews))
  );
}

/**
 * 도움돼요 토글.
 *
 * **같은 후기가 두 캐시에 있다.** 리뷰 탭은 상품 후기 목록(정렬마다 따로)을, 사진 뷰어는 리뷰 상세를
 * 읽는다. 한쪽만 바꾸면 다른 화면으로 옮겨 갔을 때 눌림과 수가 어긋나고, PATCH가 토글이라 다음
 * 누름이 반대로 뒤집힌다. 그래서 둘 다 먼저 바꾸고 실패하면 이 후기 하나만 되돌린다.
 *
 * **응답 본문을 읽지 않는다.** 토글이라 누른 뒤 상태는 화면이 이미 알고, 서버가 가진 값은 끝난 뒤
 * 다시 받아 맞춘다(`use-mutate-wishlist.ts`와 같은 원칙). 자동 재시도는 쓰지 않는다 — 토글을 두 번
 * 보내면 원래대로 돌아간다.
 *
 * **다시 받는 것은 상세뿐이다.** 목록은 낡았다고만 표시하고 지금 다시 받지 않는다. 추천순은 도움돼요
 * 수로 줄을 세워, 누르자마자 목록을 다시 받으면 읽던 후기가 손가락 아래에서 자리를 옮긴다. 다음에
 * 목록을 열 때 서버 값으로 맞춰진다.
 *
 * 실패 알림은 전역 `MutationCache`가 띄운다(#359). 여기서 또 띄우지 않는다.
 */
export function useMutateReviewRecommend() {
  const queryClient = useQueryClient();
  const listRootKey = QUERY_KEYS.review.byProductAll();

  /** 상세와 목록의 이 후기를 `liked`로 맞춘다 */
  function setLiked(reviewId: string, liked: boolean) {
    queryClient.setQueryData<ReviewDetail>(
      QUERY_KEYS.review.detail(reviewId),
      (detail) => detail && applyLiked(detail, liked),
    );
    for (const [queryKey, data] of queryClient.getQueriesData({ queryKey: listRootKey })) {
      if (!isReviewPages(data)) continue;
      queryClient.setQueryData<InfiniteData<ProductReviewPage>>(queryKey, {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          reviews: page.reviews.map((review) =>
            review.id === reviewId ? applyLiked(review, liked) : review,
          ),
        })),
      });
    }
  }

  // 아직 끝나지 않은 요청이 있으면 다시 받지 않는다. 그 요청이 반영되기 전의 값을 받아 덮으면
  // 방금 누른 후기가 되돌아간다. 자기 자신은 이 시점에 아직 pending이라 1이다
  const settle = () => {
    if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) === 1) {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review.detailAll() }),
        queryClient.invalidateQueries({ queryKey: listRootKey, refetchType: "none" }),
      ]);
    }
  };

  const mutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: ({ reviewId }: RecommendVariables) => toggleReviewRecommend(reviewId),
    retry: false,
    onMutate: async ({ reviewId, liked }) => {
      // 진행 중인 조회를 세운다. 그대로 두면 나중에 끝나면서 방금 바꾼 눌림을 덮어쓴다
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.review.detail(reviewId) }),
        queryClient.cancelQueries({ queryKey: listRootKey }),
      ]);
      setLiked(reviewId, liked);
    },
    onError: (_error, { reviewId, liked }) => setLiked(reviewId, !liked),
    onSettled: settle,
  });

  return {
    /** 도움돼요를 누른다. `liked`는 누른 뒤의 상태다. 대기 표시 없음 — 누르는 즉시 결과를 그린다 */
    toggle: (reviewId: string, liked: boolean) => mutation.mutate({ reviewId, liked }),
  };
}
