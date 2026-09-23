// 신청 화면의 세 단계와, 지금 들고 있는 값으로 그릴 수 있는 단계를 가린다.
//
// 단계는 URL(`?step=`)에 두어 기기 뒤로가기로 이전 단계에 간다(AGENTS.md 5.1). 입력값은 화면
// 상태라 새로고침하면 사라지는데 주소는 `?step=pickup` 그대로 남는다. 그대로 그리면 고른 상품도
// 사유도 없이 접수 버튼이 선다 — 값이 있는 단계까지 당긴다 (#408).

/** ① 상품 고르기 → ② 사유·사진 → ③ 수거·안내. 시안 mypa_261 → mypa_261(262) → mypa_361(362) */
export const CLAIM_STEPS = ["items", "reason", "pickup"] as const;
export type ClaimStep = (typeof CLAIM_STEPS)[number];

type ClaimProgress = {
  /** 상품을 하나라도 골랐는가 */
  picked: boolean;
  /** 사유 보기를 골랐는가 */
  reasoned: boolean;
};

/**
 * 주소의 단계를 지금 값으로 그릴 수 있는 단계로 당긴다. 앞 단계는 그대로 둔다.
 *
 * 고른 상품이 없으면 어느 단계든 ①로, 사유가 없는데 ③이면 ②로 돌린다.
 */
export function reachableStep(step: ClaimStep, { picked, reasoned }: ClaimProgress): ClaimStep {
  if (!picked) {
    return "items";
  }
  if (step === "pickup" && !reasoned) {
    return "reason";
  }
  return step;
}
