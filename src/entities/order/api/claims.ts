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
import type { PresignedUpload } from "@/shared/api/upload-image";

/**
 * 신청 유형. 백엔드 `ClaimType` 그대로다.
 *
 * **`CANCEL`은 이 경로로 보내지 않는다.** 클레임은 배송완료 주문만 받으므로 취소를 여기로
 * 보내면 늘 `ORDER_409_NOT_CLAIMABLE`이다. 주문 취소는 `cancelOrder`다.
 */
export const CLAIM_TYPES = ["RETURN", "EXCHANGE"] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

/**
 * 신청 사유 코드. 백엔드 `ClaimReasonCode` 다섯 이름 그대로다.
 *
 * 이 밖의 값은 서버가 `ORDER_400_INVALID_CLAIM_REASON_CODE`로 막는다. 코드는 우리가 넘긴 사유
 * 보기 다섯을 백엔드가 받아 만든 것이다 (백엔드 #141, 2026-09-23).
 */
export type ClaimReasonCode =
  "CHANGE_OF_MIND" | "DAMAGED" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "OTHER";

export type CreateClaimItem = {
  orderItemId: number;
  /** 1 이상. 서버 `@Positive` */
  quantity: number;
};

export type CreateClaimRequest = {
  claimType: ClaimType;
  /** 고른 사유. **필수다**(`@NotBlank`) — 빠지면 본문 검증에서 400이다 (백엔드 #141) */
  reasonCode: ClaimReasonCode;
  /** 선택이다. 서버가 `@Size(max = 1000)`만 건다 */
  reason?: string;
  items: CreateClaimItem[];
  /**
   * 올려 둔 사진의 `fileUrl`. 선택이고 서버에 장수 제한은 없다.
   *
   * 서버가 본인이 올린 파일인지 확인하고(`ORDER_403_FORBIDDEN_IMAGE`), 접수가 저장된 뒤에
   * 확정한다. 빈 배열 대신 빼고 보낸다
   */
  imageUrls?: string[];
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
 * 반품·교환 첨부 사진을 올릴 주소를 받는다. `shared/api/upload-image`의 `uploadImage`에 넘긴다.
 *
 * 회원·리뷰 사진과 같은 방식이다 — 받은 주소로 10분 안에 `x-amz-tagging: status=pending`을
 * 붙여 PUT한다. 확장자(`jpg`·`jpeg`·`png`·`webp`·`gif`)는 서버가 거른다
 * (`ORDER_400_INVALID_IMAGE_EXTENSION`). 백엔드 #125로 2026-09-23에 열렸다 (#408).
 */
export function issueOrderImageUpload(extension: string): Promise<PresignedUpload> {
  return apiRequest<PresignedUpload>("/orders/images/presigned-url", {
    method: "POST",
    body: { extension },
  });
}

/** 반품·교환을 접수한다. 성공하면 `201`과 접수 번호가 온다. */
export async function createClaim(
  orderId: number,
  request: CreateClaimRequest,
): Promise<CreateClaimResult> {
  return apiRequest<CreateClaimResult>(`/orders/${orderId}/claims`, {
    method: "POST",
    body: request,
  });
}
