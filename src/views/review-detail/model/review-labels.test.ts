// 칩과 날짜가 시안 꼴("품종 · N세 · Nkg" · "사용 N주째" · "YYYY. MM. DD")로 나오는지 본다.
import { expect, test } from "vitest";

import { toReviewDate, toReviewPetProfile, toUsageLabel } from "./review-labels";

test("아이 프로필은 품종·나이·몸무게를 가운뎃점으로 잇고 몸무게 소수를 다듬는다", () => {
  expect(toReviewPetProfile({ breedName: "말티즈", age: 8, weight: 4 })).toBe("말티즈 · 8세 · 4kg");
  expect(toReviewPetProfile({ breedName: "코리안 숏헤어", age: 3, weight: 4.25 })).toBe(
    "코리안 숏헤어 · 3세 · 4.3kg",
  );
});

test("사용 기간은 일주일 전엔 날로, 넘으면 주로 말한다", () => {
  expect(toUsageLabel(3)).toBe("사용 3일째");
  expect(toUsageLabel(7)).toBe("사용 1주째");
  expect(toUsageLabel(16)).toBe("사용 2주째");
});

test("날짜는 시안 꼴이고 읽을 수 없으면 비운다", () => {
  expect(toReviewDate("2026-08-31")).toBe("2026. 08. 31");
  expect(toReviewDate("2026-08-31T00:00:00+09:00")).toBe("2026. 08. 31");
  expect(toReviewDate("언제")).toBe("");
});
