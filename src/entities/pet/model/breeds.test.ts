// 몸무게 칸의 예시 문구가 종·체구로 갈리는지 본다 (QA No.205).
import { expect, test } from "vitest";

import { weightPlaceholder } from "./breeds";

// QA가 말티즈·골든 리트리버·코리안 숏헤어를 골랐는데 셋 다 "평균 몸무게 5kg"이었다
test("소형견·대형견·고양이의 예시가 서로 다르다", () => {
  const small = weightPlaceholder("dog", "small");
  const large = weightPlaceholder("dog", "large");
  const cat = weightPlaceholder("cat", null);

  expect(new Set([small, large, cat]).size).toBe(3);
  expect(small).toBe("소형견은 대개 10kg 미만이에요");
  expect(weightPlaceholder("dog", "medium")).toBe("중형견은 대개 10~25kg이에요");
  expect(large).toBe("대형견은 대개 25kg 이상이에요");
  expect(cat).toBe("고양이는 대개 3~5kg이에요");
});

// 고양이는 체구를 묻지 않는다(#391). 초안에 강아지 때 고른 체구가 남아 있어도 고양이 예시다
test("고양이는 체구와 상관없이 고양이 예시다", () => {
  expect(weightPlaceholder("cat", "large")).toBe("고양이는 대개 3~5kg이에요");
});

test("체구가 없는 강아지는 단위만 알린다", () => {
  expect(weightPlaceholder("dog", null)).toBe("몸무게를 kg으로 적어주세요");
  expect(weightPlaceholder("dog", "")).toBe("몸무게를 kg으로 적어주세요");
});
