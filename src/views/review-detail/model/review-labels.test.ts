// 칩과 날짜가 시안 꼴("품종 · N세 · Nkg" · "YYYY. MM. DD")로 나오는지 본다.
// 사용 기간 문구는 `entities/review`로 옮겨 그쪽에서 검증한다.
import { expect, test } from "vitest";

import { toReviewDate, toReviewPetProfile } from "./review-labels";

test("아이 프로필은 품종·나이·몸무게를 가운뎃점으로 잇고 몸무게 소수를 다듬는다", () => {
  expect(toReviewPetProfile({ breedName: "말티즈", age: 8, weight: 4 })).toBe("말티즈 · 8세 · 4kg");
  expect(toReviewPetProfile({ breedName: "코리안 숏헤어", age: 3, weight: 4.25 })).toBe(
    "코리안 숏헤어 · 3세 · 4.3kg",
  );
});

test("날짜는 시안 꼴이고 읽을 수 없으면 비운다", () => {
  expect(toReviewDate("2026-08-31")).toBe("2026. 08. 31");
  expect(toReviewDate("2026-08-31T00:00:00+09:00")).toBe("2026. 08. 31");
  expect(toReviewDate("언제")).toBe("");
});
