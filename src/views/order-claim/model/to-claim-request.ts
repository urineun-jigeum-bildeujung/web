// 신청 화면에서 모은 값을 접수 요청 모양으로 옮긴다.
//
// **고른 사유는 코드로 싣는다(`reasonCode`, 필수).** 백엔드가 사유 코드 필드 하나만 더했다
// (#141, 2026-09-23) — 코드는 `claim-reasons`의 다섯 이름 그대로다 (#417).
//
// **서버에 필드가 없는 값은 사유 글 하나에 묶는다.** `reason`은 자유 문자열(1,000자)이고 시안은
// 상세 사유·수거 희망일·수거 요청사항도 받는다. 백엔드가 수거 필드는 만들지 않기로 해서 사람이
// 읽을 수 있는 줄로 묶어 `reason`에 싣는다 (#408). 사유 보기는 코드로 가므로 글에 다시 쓰지 않는다.
//
// 사진은 여기서 다루지 않는다. 올린 뒤에야 주소가 생겨 접수 훅(`useMutateClaim`)이 채운다.

import type { ClaimType, CreateClaimRequest } from "@/entities/order";

import type { ClaimReason } from "./claim-reasons";
import { toRequestItems, type ClaimSelection } from "./claim-selection";

/** 시안의 상세 사유 글자 수 표시(0/300) */
export const DETAIL_MAX = 300;

/**
 * 수거 요청사항 글자 수.
 *
 * 시안에는 표시가 없다. 사유 글 1,000자(서버 `@Size`) 안에 세 줄이 모두 들도록 우리가 정했다 —
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
 * [상세 사유] 포장이 찢어져 있었어요
 * [수거 희망일] 2026-09-24
 * [수거 요청사항] 문 앞에 두었어요
 * ```
 */
export function toClaimReasonText(
  draft: Pick<ClaimDraft, "detail" | "pickupDate" | "pickupRequest">,
): string {
  const detail = draft.detail.trim();
  const pickupRequest = draft.pickupRequest.trim();

  return [
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
    reasonCode: draft.reason,
    reason: toClaimReasonText(draft),
    items: toRequestItems(selection),
  };
}
