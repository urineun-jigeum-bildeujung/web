// 반품·교환 신청 API.
//
// **규격은 로컬 백엔드 소스에서 옮겼다** (`order-service`의 `adapter/in/web/claim`). 명세 화면에는
// 이 엔드포인트 행이 없어 `CreateClaimRequest`·`CreateClaimResponse`와 `CreateClaimService`를
// 직접 읽었다 (#327).
//
// 서버가 거는 조건이라 화면이 먼저 막아 주는 편이 낫다.
//
// ```
// 배송완료 + 7일 이내      Order.isClaimableForReturn  DELIVERED && deliveredAt + 7일 > now
// 품목 중복 금지            CreateClaimRequest.isItemsDistinct
// 수량 ≤ 남은 수량          CLAIM_ITEM_QUANTITY_EXCEEDED
// 진행 중인 신청 없음        CLAIM_ALREADY_IN_PROGRESS
// ```

import { apiRequest } from "@/shared/api/client";

/**
 * 신청 유형. 백엔드 `ClaimType` 그대로다.
 *
 * **`CANCEL`은 이 경로로 보내지 않는다.** 클레임은 배송완료 주문만 받으므로 취소를 여기로
 * 보내면 늘 `ORDER_409_NOT_CLAIMABLE`이다. 주문 취소는 `cancelOrder`다.
 */
export const CLAIM_TYPES = ["RETURN", "EXCHANGE"] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export type CreateClaimItem = {
  orderItemId: number;
  /** 1 이상. 서버 `@Positive` */
  quantity: number;
};

export type CreateClaimRequest = {
  claimType: ClaimType;
  /** 선택이다. 서버가 `@Size(max = 1000)`만 건다 */
  reason?: string;
  items: CreateClaimItem[];
};

export type CreateClaimResult = {
  claimId: number;
  claimType: string;
  /** `REQUESTED`로 시작한다. 이후 `COLLECTING` → `INSPECTING` → `COMPLETED`·`REJECTED` */
  claimStatus: string;
  /** ISO 8601 */
  requestedAt: string;
};

/**
 * 반품·교환을 접수한다. 성공하면 `201`과 접수 번호가 온다.
 *
 * **`imageUrls`를 보내지 않는다.** 요청 필드에는 있지만 클레임용 presigned URL 엔드포인트가
 * 없어 주소를 만들 방법이 없다. 있는 것은 회원 프로필과 리뷰 둘뿐이다 (#327).
 */
export async function createClaim(
  orderId: number,
  request: CreateClaimRequest,
): Promise<CreateClaimResult> {
  return apiRequest<CreateClaimResult>(`/orders/${orderId}/claims`, {
    method: "POST",
    body: request,
  });
}
