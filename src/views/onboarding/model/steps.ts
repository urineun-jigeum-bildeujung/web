// 온보딩 단계 정의. URL의 step 파라미터가 이 값을 쓴다.

export const ONBOARDING_STEPS = ["intro", "basic", "detail", "breed", "health", "done"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * 상단 진행 표시에 세는 단계. 도입부·품종 선택·완료는 빼고
 * 실제로 입력하는 세 단계만 헤아린다. 시안 onbo_002~004가 이에 해당한다.
 */
export const FORM_STEPS: OnboardingStep[] = ["basic", "detail", "health"];

export function getStepProgress(step: OnboardingStep) {
  const index = FORM_STEPS.indexOf(step);
  if (index === -1) return null;
  return { current: index + 1, total: FORM_STEPS.length };
}
