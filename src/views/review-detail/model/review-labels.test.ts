// 날짜가 시안 꼴("YYYY. MM. DD")로 나오는지 본다.
// 사용 기간 문구와 아이 줄은 `entities/review`로 옮겨 그쪽에서 검증한다.
import { expect, test } from "vitest";

import { toReviewDate } from "./review-labels";

test("날짜는 시안 꼴이고 읽을 수 없으면 비운다", () => {
  expect(toReviewDate("2026-08-31")).toBe("2026. 08. 31");
  expect(toReviewDate("2026-08-31T00:00:00+09:00")).toBe("2026. 08. 31");
  expect(toReviewDate("언제")).toBe("");
});
