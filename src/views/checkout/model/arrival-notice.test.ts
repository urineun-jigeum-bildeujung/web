// 도착 예정 문구. 한국 날짜로 모레를 세는지, 달이 바뀌는 자리와 자정 근처를 본다 (QA No.45, #595).
import { expect, test } from "vitest";

import { arrivalNotice } from "./arrival-notice";

test("시안 문구 모양으로 모레를 알린다", () => {
  // 2026-09-01 12:00 KST
  expect(arrivalNotice(new Date("2026-09-01T03:00:00Z"))).toBe("지금 주문하면 모레(9/3) 도착해요");
});

test("달이 바뀌면 다음 달 날짜로 센다", () => {
  // 2026-09-30 10:00 KST
  expect(arrivalNotice(new Date("2026-09-30T01:00:00Z"))).toBe("지금 주문하면 모레(10/2) 도착해요");
});

// UTC로는 아직 전날이다. 브라우저 시간대로 세면 하루 늦게 뜬다
test("한국 새벽에도 한국 날짜로 센다", () => {
  // 2026-10-01 01:00 KST = 2026-09-30 16:00 UTC
  expect(arrivalNotice(new Date("2026-09-30T16:00:00Z"))).toBe("지금 주문하면 모레(10/3) 도착해요");
});
