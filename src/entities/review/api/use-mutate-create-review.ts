// 리뷰를 등록하는 훅. 사진이 있으면 먼저 올리고 그 주소와 함께 보낸다. 화면은 `useMutation`을 직접 부르지 않는다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadImage } from "@/shared/api/upload-image";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { createReview, issueReviewImageUpload, type ReviewCreateRequest } from "./reviews";

type CreateReviewInput = {
  request: ReviewCreateRequest;
  /** 붙여 둔 사진. 세 장까지. 있으면 먼저 올리고 `images`에 그 주소를 싣는다 */
  photos: File[];
};

/**
 * 리뷰를 등록한다.
 *
 * **업로드를 훅 안에 두는 이유가 있다(#269와 같다).** 화면이 따로 올리면 `isSubmitting`이
 * 업로드 시간을 덮지 못해 그동안 버튼이 멈춰 보이고, 실패도 전역 알림 경로를 지나지 않는다.
 *
 * 사진은 동시에 올린다. 하나가 실패해 나머지가 `pending`으로 남아도 버킷 라이프사이클이
 * 지우므로 프론트가 치울 것은 없다.
 *
 * 성공하면 내 후기 목록과 그 상품의 리뷰 캐시를 비운다. 완료 화면의 "확인"이 내 후기 목록으로
 * 가는데 비우지 않으면 방금 쓴 후기가 거기 없다.
 */
export function useMutateCreateReview() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ request, photos }: CreateReviewInput) => {
      const images = await Promise.all(
        photos.map((photo) => uploadImage(photo, issueReviewImageUpload)),
      );
      return createReview({ ...request, ...(images.length > 0 && { images }) });
    },
    onSuccess: async (_, { request }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review.myAll() }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review.byProduct(request.productId) }),
      ]);
    },
  });

  return {
    createReview: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
