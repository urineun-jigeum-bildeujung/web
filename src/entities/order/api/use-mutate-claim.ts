// 반품·교환을 접수하는 훅. 사진이 있으면 먼저 올리고 그 주소와 함께 보낸다.
// 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").
//
// **낙관적 갱신을 쓰지 않는다.** 접수하면 기사가 물건을 가지러 오는 되돌리기 어려운 동작이라,
// 서버가 받았다고 답한 뒤에 화면을 옮긴다 (AGENTS.md 5.8).
//
// **실패 알림은 여기서 하지 않는다.** `AppProviders`의 `MutationCache.onError`가 모든 변경
// 실패를 토스트로 알린다. S3가 사진을 거절한 것(`ImageUploadError`)도 같은 길로 문구가 된다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadImage } from "@/shared/api/upload-image";
import { QUERY_KEYS } from "@/shared/config/query-keys";

import { createClaim, issueOrderImageUpload, type CreateClaimRequest } from "./claims";

type RequestClaimInput = {
  /** 사진 주소는 여기서 채운다. 화면이 넘기지 않는다 */
  request: Omit<CreateClaimRequest, "imageUrls">;
  /** 붙여 둔 사진. 있으면 먼저 올리고 `imageUrls`에 그 주소를 싣는다 */
  photos: File[];
};

/**
 * 반품·교환을 접수한다.
 *
 * **업로드를 훅 안에 두는 이유는 리뷰 등록과 같다.** 화면이 따로 올리면 `isRequesting`이
 * 업로드 시간을 덮지 못해 그동안 버튼이 멈춰 보이고, 실패도 전역 알림 경로를 지나지 않는다.
 *
 * 사진은 동시에 올린다. 하나가 실패해 나머지가 `pending`으로 남아도 버킷 라이프사이클이
 * 3일 뒤 지우므로 프론트가 치울 것은 없다 (#408).
 */
export function useMutateClaim(orderId: number) {
  const queryClient = useQueryClient();

  // 함수를 그대로 넘기지 않고 감싼다. 직접 넘기면 이 훅이 평가될 때의 바인딩이 굳어,
  // 테스트가 모듈을 갈아끼워도 옛 함수가 불린다 (`use-mutate-order`도 같은 이유로 감싼다).
  const mutation = useMutation({
    mutationFn: async ({ request, photos }: RequestClaimInput) => {
      const imageUrls = await Promise.all(
        photos.map((photo) => uploadImage(photo, issueOrderImageUpload)),
      );
      return createClaim(orderId, { ...request, ...(imageUrls.length > 0 && { imageUrls }) });
    },
    // 접수되면 상품 줄의 `claims[]`가 달라진다. 목록의 상태 뱃지도 함께 움직일 수 있다
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order.all }),
  });

  return {
    request: mutation.mutateAsync,
    isRequesting: mutation.isPending,
  };
}
