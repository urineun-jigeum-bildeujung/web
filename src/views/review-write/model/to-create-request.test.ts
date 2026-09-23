// 초안을 등록 요청으로 옮기는 규칙을 고정한다. 답한 문항만 실리는 것과 필수가 빌 때가 핵심이다.
import { expect, test } from "vitest";

import type { ReviewDraft } from "./draft-storage";
import { answeredValues, toCreateRequest } from "./to-create-request";

const FULL: ReviewDraft = {
  score: 4.5,
  days: "16",
  responses: { PALATABILITY: "POSITIVE", FEEDING_CONVENIENCE: "NEUTRAL" },
  petIds: ["3", "5"],
  text: "  확실히 예전보다 계단 오를 때 덜 힘들어해요  ",
};

test("답한 문항만 열거형 값 그대로 싣는다", () => {
  expect(answeredValues(FULL.responses)).toEqual([
    { questionKey: "PALATABILITY", answerValue: "POSITIVE" },
    { questionKey: "FEEDING_CONVENIENCE", answerValue: "NEUTRAL" },
  ]);
  expect(answeredValues({})).toEqual([]);
});

test("문자열로 든 값을 숫자로 옮기고 후기 앞뒤 공백을 지운다", () => {
  expect(toCreateRequest(FULL, "7")).toEqual({
    productId: 7,
    petIds: [3, 5],
    starRate: 4.5,
    usagePeriod: 16,
    answerValues: [
      { questionKey: "PALATABILITY", answerValue: "POSITIVE" },
      { questionKey: "FEEDING_CONVENIENCE", answerValue: "NEUTRAL" },
    ],
    text: "확실히 예전보다 계단 오를 때 덜 힘들어해요",
  });
});

test("필수가 비면 요청을 만들지 않는다", () => {
  expect(toCreateRequest({ ...FULL, score: 0 }, "7")).toBeNull();
  expect(toCreateRequest({ ...FULL, days: "" }, "7")).toBeNull();
  expect(toCreateRequest({ ...FULL, petIds: [] }, "7")).toBeNull();
  expect(toCreateRequest({ ...FULL, text: "   " }, "7")).toBeNull();
  // 서버가 반응 문항을 하나 이상 요구한다
  expect(toCreateRequest({ ...FULL, responses: {} }, "7")).toBeNull();
  // 상품 id가 숫자가 아니면 서버가 본문을 통째로 거절한다
  expect(toCreateRequest(FULL, "abc")).toBeNull();
});
