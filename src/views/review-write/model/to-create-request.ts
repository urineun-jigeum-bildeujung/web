// 리뷰 초안을 등록 요청으로 옮긴다.
//
// 화면은 문자열(사용 기간·아이 id)로 들고 API는 숫자로 받는다. 옮기는 자리를 화면 안에 두면
// 테스트할 수 없어 여기로 뺐다. 온보딩의 `to-register-request`와 같은 판단이다.

import type { ReviewCreateRequest } from "@/entities/review";

import type { ReviewDraft } from "./draft-storage";
import { HANDLING_QUESTION, RATING_STEP_QUESTIONS } from "./questions";

const QUESTIONS = [...RATING_STEP_QUESTIONS, HANDLING_QUESTION];

/** 답한 문항만 골라 요청 모양으로. 안 고른 문항을 빈 값으로 넣으면 서버가 `INVALID_ANSWER`로 거절한다 */
export function answeredValues(
  responses: ReviewDraft["responses"],
): ReviewCreateRequest["answerValues"] {
  return QUESTIONS.flatMap((question) => {
    const answerValue = responses[question.key];
    return answerValue ? [{ questionKey: question.key, answerValue }] : [];
  });
}

/**
 * 초안을 요청으로 옮긴다. 필수 값이 하나라도 비면 `null`이다.
 *
 * **필수 문항 둘이 서버 조건을 함께 채운다.** 서버가 `answerValues`에 하나 이상을 요구하는데
 * (`@NotEmpty`), 시안이 기호성과 급여 편의성을 필수로 정해(#302) 화면이 이미 둘을 받는다.
 * 그전에는 "하나 이상"이라는 임시 규칙으로 막고 백엔드에 제약을 풀어 달라고 물어 둔 상태였다(#291) —
 * 이제 그럴 필요가 없다. 아래 검사는 화면을 거치지 않는 경로를 위한 안전망으로 남긴다.
 */
export function toCreateRequest(draft: ReviewDraft, productId: string): ReviewCreateRequest | null {
  const usagePeriod = Number(draft.days);
  const petId = Number(draft.petId);
  const productIdNumber = Number(productId);
  const text = draft.text.trim();
  const answerValues = answeredValues(draft.responses);

  if (draft.score <= 0 || !Number.isInteger(usagePeriod) || usagePeriod <= 0) return null;
  if (!draft.petId || !Number.isInteger(petId) || !Number.isInteger(productIdNumber)) return null;
  if (text.length === 0 || answerValues.length === 0) return null;

  return {
    productId: productIdNumber,
    petId,
    starRate: draft.score,
    usagePeriod,
    answerValues,
    text,
  };
}
