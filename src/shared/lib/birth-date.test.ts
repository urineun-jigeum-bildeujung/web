// 생년월일 다듬기와 옮기기. 달력에 없는 날이 그대로 나가면 서버가 본문을 통째로 거절한다.
import { expect, test } from "vitest";

import { formatBirthDateInput, parseBirthDate } from "./birth-date";

test("치는 대로 0000. 00. 00 꼴로 맞춘다", () => {
  expect(formatBirthDateInput("2003")).toBe("2003");
  expect(formatBirthDateInput("200310")).toBe("2003. 10");
  expect(formatBirthDateInput("20031029")).toBe("2003. 10. 29");
});

test("여덟 자를 넘기지 않는다", () => {
  expect(formatBirthDateInput("2003102999")).toBe("2003. 10. 29");
});

test("숫자가 아닌 글자는 들어가지 않는다", () => {
  expect(formatBirthDateInput("이천삼년")).toBe("");
});

test("여러 표기를 YYYY-MM-DD로 옮긴다", () => {
  expect(parseBirthDate("2022-03-15")).toBe("2022-03-15");
  expect(parseBirthDate("2022. 03. 15")).toBe("2022-03-15");
  expect(parseBirthDate("20220315")).toBe("2022-03-15");
});

test("여덟 자가 아니면 못 알아듣는다", () => {
  expect(parseBirthDate("")).toBeNull();
  expect(parseBirthDate("2022")).toBeNull();
  expect(parseBirthDate("2022-3-1")).toBeNull();
});

// `2003-10-92`가 그대로 나가면 서버가 LocalDate로 읽지 못해 본문을 통째로 거절한다
test("달력에 없는 날을 거른다", () => {
  expect(parseBirthDate("20031092")).toBeNull();
  expect(parseBirthDate("20220230")).toBeNull();
  expect(parseBirthDate("20221301")).toBeNull();
  expect(parseBirthDate("20220100")).toBeNull();
});

test("윤년은 가리고 평년은 거른다", () => {
  expect(parseBirthDate("20240229")).toBe("2024-02-29");
  expect(parseBirthDate("20230229")).toBeNull();
});

// API가 @PastOrPresent라 앞날은 거절당한다
test("앞날을 거른다", () => {
  const nextYear = new Date().getFullYear() + 1;
  expect(parseBirthDate(`${nextYear}0101`)).toBeNull();
});
