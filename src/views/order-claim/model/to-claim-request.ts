// 신청 화면에서 모은 값을 접수 요청 모양으로 옮긴다.
//
// **서버가 받지 않는 값을 사유 글 하나에 묶는다.** `CreateClaimRequest`는 `claimType`·`reason`
// (자유 문자열, 1,000자)·`items`·`imageUrls`뿐인데 시안은 사유 보기·상세 사유·수거 희망일·수거
// 요청사항을 받는다. 백엔드가 바빠 필드를 늘리기 어려워(2026-09-23), 사람이 읽을 수 있는 줄로
// 묶어 `reason`에 싣는다. 수거 필드가 생기면 그때 나눈다 (#408).
//
// 사진은 여기서 다루지 않는다. 올린 뒤에야 주소가 생겨 접수 훅(`useMutateClaim`)이 채운다.

import type { ClaimType, CreateClaimRequest } from "@/entities/order";

import { CLAIM_REASON_LABEL, type ClaimReason } from "./claim-reasons";
import { toRequestItems, type ClaimSelection } from "./claim-selection";

/** 시안의 상세 사유 글자 수 표시(0/300) */
export const DETAIL_MAX = 300;

/**
 * 수거 요청사항 글자 수.
 *
 * 시안에는 표시가 없다. 사유 글 1,000자(서버 `@Size`) 안에 네 줄이 모두 들도록 우리가 정했다 —
 * 상세 사유 300자 + 요청사항 100자 + 머리글·날짜를 더해도 500자를 넘지 않는다.
 */
export const PICKUP_REQUEST_MAX = 100;

export type ClaimDraft = {
  selection: ClaimSelection;
  reason: ClaimReason;
  /** 상세 사유. 비어 있을 수 있다 */
  detail: string;
  /** `YYYY-MM-DD` */
  pickupDate: string;
  /** 수거 요청사항. 비어 있을 수 있다 */
  pickupRequest: string;
};

/**
 * 사유 글. 한 줄에 하나씩 머리글을 달고, 비어 있는 선택 항목은 줄째 뺀다.
 *
 * ```
 * [사유] 상품 파손 · 불량
 * [상세 사유] 포장이 찢어져 있었어요
 * [수거 희망일] 2026-09-24
 * [수거 요청사항] 문 앞에 두었어요
 * ```
 */
export function toClaimReasonText(draft: Omit<ClaimDraft, "selection">): string {
  const detail = draft.detail.trim();
  const pickupRequest = draft.pickupRequest.trim();

  return [
    `[사유] ${CLAIM_REASON_LABEL[draft.reason]}`,
    detail && `[상세 사유] ${detail}`,
    `[수거 희망일] ${draft.pickupDate}`,
    pickupRequest && `[수거 요청사항] ${pickupRequest}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function toCreateClaimRequest(
  claimType: ClaimType,
  { selection, ...draft }: ClaimDraft,
): Omit<CreateClaimRequest, "imageUrls"> {
  return {
    claimType,
    reason: toClaimReasonText(draft),
    items: toRequestItems(selection),
  };
}
