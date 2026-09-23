// 접수 요청 묶기 테스트. 사유는 코드로, 서버에 필드가 없는 값은 사유 글에 빠짐없이 서버 한도 안에서 실리는지 본다.
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

// 사유 보기는 코드(`reasonCode`)로 따로 간다. 글에 또 쓰면 같은 것이 두 번 실린다 (#417)
test("상세 사유·수거 희망일·요청사항을 줄마다 싣는다", () => {
  expect(toClaimReasonText(draft)).toBe(
    [
      "[상세 사유] 포장이 찢어져 있었어요",
      "[수거 희망일] 2026-09-24",
      "[수거 요청사항] 문 앞에 두었어요",
    ].join("\n"),
  );
});

// 빈 머리글만 남으면 읽는 사람이 무엇을 빠뜨렸는지 헷갈린다
test("비어 있는 선택 항목은 줄째 뺀다", () => {
  expect(toClaimReasonText({ ...draft, detail: "   ", pickupRequest: "" })).toBe(
    "[수거 희망일] 2026-09-24",
  );
});

// 서버 `CreateClaimRequest.reason`이 `@Size(max = 1000)`이다. 넘으면 접수가 400으로 막힌다
test("글자 수를 다 채워도 서버 한도 1,000자 안에 든다", () => {
  const longest = toClaimReasonText({
    ...draft,
    detail: "가".repeat(DETAIL_MAX),
    pickupRequest: "나".repeat(PICKUP_REQUEST_MAX),
  });

  expect(longest.length).toBeLessThanOrEqual(1000);
});

// **사유 코드는 필수다**(`@NotBlank`). 빠지면 본문 검증에서 400이다 (백엔드 #141 · #417)
test("고른 사유를 코드로, 상품과 수량·사유 글과 함께 요청 모양으로 옮긴다", () => {
  expect(toCreateClaimRequest("RETURN", draft)).toEqual({
    claimType: "RETURN",
    reasonCode: "DAMAGED",
    reason: toClaimReasonText(draft),
    items: [
      { orderItemId: 11, quantity: 1 },
      { orderItemId: 12, quantity: 2 },
    ],
  });
});
