// 반품·교환 사유 보기 다섯. 문구는 시안(mypa_261 3333:37439, mypa_262 3333:37668) 그대로다.
//
// **서버에는 사유 코드가 없다.** `CreateClaimRequest.reason`은 자유 문자열 하나라, 고른 보기의
// 문구를 사유 글 첫 줄에 싣는다(to-claim-request). 코드는 화면 안에서만 쓴다 (#408).

export const CLAIM_REASON_LABEL = {
  CHANGE_OF_MIND: "단순 변심",
  DAMAGED: "상품 파손 · 불량",
  WRONG_ITEM: "오배송 (다른 상품이 왔어요)",
  NOT_AS_DESCRIBED: "상품 설명과 달라요",
  OTHER: "기타",
} as const;

export type ClaimReason = keyof typeof CLAIM_REASON_LABEL;

/** 화면에 늘어놓는 순서. 시안의 위에서 아래 순이다 */
export const CLAIM_REASONS: readonly ClaimReason[] = [
  "CHANGE_OF_MIND",
  "DAMAGED",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
  "OTHER",
];

/** 라디오의 `onValueChange`가 주는 문자열이 보기 중 하나인지 가린다 */
export function isClaimReason(value: string): value is ClaimReason {
  // `in`은 `toString` 같은 물려받은 이름에도 참이라 제 것만 본다
  return Object.hasOwn(CLAIM_REASON_LABEL, value);
}
