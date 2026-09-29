// 자유 입력을 API 값으로 옮기는 규칙. 잘못 친 값이 그럴듯한 값으로 바뀌지 않는지 본다.
import { expect, test } from "vitest";

import {
  describeAgeError,
  formatWeight,
  MAX_PET_AGE,
  parseAge,
  parseWeight,
} from "./parse-profile-input";

test("단위가 섞여 들어와도 숫자를 뽑는다", () => {
  expect(parseWeight("4키로")).toBe(4);
  expect(parseWeight("5 kg")).toBe(5);
  expect(parseAge("4세")).toBe(4);
});

// `.5`를 `5`로 읽으면 0.5kg 고양이가 5kg으로 저장된다 — 십 배다
test("앞자리 0이 없는 소수도 읽는다", () => {
  expect(parseWeight(".5")).toBe(0.5);
});

// 숫자만 찾으면 `-4kg`이 `4`가 되어 잘못 친 값이 그럴듯한 몸무게로 저장된다
test("음수를 양수로 바꾸지 않는다", () => {
  expect(parseWeight("-4kg")).toBeNull();
  expect(parseAge("-2세")).toBeNull();
});

test("숫자가 없으면 없다고 답한다", () => {
  expect(parseWeight("모름")).toBeNull();
  expect(parseAge("")).toBeNull();
});

// QA No.242. 소수 여러 자리가 그대로 저장됐다
test("몸무게를 소수 첫째 자리로 반올림한다", () => {
  expect(parseWeight("10.11111")).toBe(10.1);
  expect(parseWeight("4.56")).toBe(4.6);
});

// 반올림해 0이 되면 API(@Positive)가 거절한다
test("반올림해 0이 되는 몸무게는 없다고 답한다", () => {
  expect(parseWeight("0.04")).toBeNull();
});

test("저장된 몸무게를 입력칸 글자로 옮긴다", () => {
  expect(formatWeight(4)).toBe("4");
  expect(formatWeight(10.11111)).toBe("10.1");
});

// QA No.196. 999999세가 그대로 넘어갔다
test("상한을 넘는 나이는 없다고 답한다", () => {
  expect(parseAge(String(MAX_PET_AGE))).toBe(MAX_PET_AGE);
  expect(parseAge(String(MAX_PET_AGE + 1))).toBeNull();
  expect(parseAge("999999")).toBeNull();
});

test("나이 칸이 알릴 말은 상한을 넘은 것과 못 알아들은 것을 가른다", () => {
  expect(describeAgeError("")).toBeNull();
  expect(describeAgeError("4")).toBeNull();
  expect(describeAgeError("31")).toBe("나이는 30살까지 적을 수 있어요");
  expect(describeAgeError("0")).toBe("나이를 적어주세요");
});
