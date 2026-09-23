// 접수 요청 묶기 테스트. 서버가 받지 않는 값이 사유 글에 빠짐없이, 서버 한도 안에서 실리는지 본다.
import { expect, test } from "vitest";

import {
  DETAIL_MAX,
  PICKUP_REQUEST_MAX,
  toClaimReasonText,
  toCreateClaimRequest,
  type ClaimDraft,
} from "./to-claim-request";

const draft: ClaimDraft = {
  selection: { 11: 1, 12: 2 },
  reason: "DAMAGED",
  detail: "  포장이 찢어져 있었어요  ",
  pickupDate: "2026-09-24",
  pickupRequest: " 문 앞에 두었어요 ",
};

test("사유 보기·상세 사유·수거 희망일·요청사항을 줄마다 싣는다", () => {
  expect(toClaimReasonText(draft)).toBe(
    [
      "[사유] 상품 파손 · 불량",
      "[상세 사유] 포장이 찢어져 있었어요",
      "[수거 희망일] 2026-09-24",
      "[수거 요청사항] 문 앞에 두었어요",
    ].join("\n"),
  );
});

// 빈 머리글만 남으면 읽는 사람이 무엇을 빠뜨렸는지 헷갈린다
test("비어 있는 선택 항목은 줄째 뺀다", () => {
  expect(toClaimReasonText({ ...draft, detail: "   ", pickupRequest: "" })).toBe(
    ["[사유] 상품 파손 · 불량", "[수거 희망일] 2026-09-24"].join("\n"),
  );
});

// 서버 `CreateClaimRequest.reason`이 `@Size(max = 1000)`이다. 넘으면 접수가 400으로 막힌다
test("글자 수를 다 채워도 서버 한도 1,000자 안에 든다", () => {
  const longest = toClaimReasonText({
    ...draft,
    reason: "WRONG_ITEM",
    detail: "가".repeat(DETAIL_MAX),
    pickupRequest: "나".repeat(PICKUP_REQUEST_MAX),
  });

  expect(longest.length).toBeLessThanOrEqual(1000);
});

test("고른 상품과 수량, 사유 글을 요청 모양으로 옮긴다", () => {
  expect(toCreateClaimRequest("RETURN", draft)).toEqual({
    claimType: "RETURN",
    reason: toClaimReasonText(draft),
    items: [
      { orderItemId: 11, quantity: 1 },
      { orderItemId: 12, quantity: 2 },
    ],
  });
});
