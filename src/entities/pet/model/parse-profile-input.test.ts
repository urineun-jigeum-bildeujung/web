// 자유 입력을 API 값으로 옮기는 규칙. 잘못 친 값이 그럴듯한 값으로 바뀌지 않는지 본다.
import { expect, test } from "vitest";

import { parseAge, parseBirthDate, parseWeight } from "./parse-profile-input";

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

// `2003-10-92`가 그대로 나가면 서버가 LocalDate로 읽지 못해 본문을 통째로 거절한다
test("달력에 없는 날과 앞날을 거른다", () => {
  expect(parseBirthDate("2003-10-92")).toBeNull();
  expect(parseBirthDate("2022. 02. 30")).toBeNull();
  expect(parseBirthDate("2999-01-01")).toBeNull();
  expect(parseBirthDate("2022. 03. 15")).toBe("2022-03-15");
});
