// 입력칸이 받는 값을 거르는 규칙.
import { describe, expect, test } from "vitest";

import { digitsOnly, formatBirthday } from "./input-guards";

describe("digitsOnly", () => {
  test("숫자가 아닌 것을 지운다", () => {
    expect(digitsOnly("4키로")).toBe("4");
    expect(digitsOnly("abc")).toBe("");
  });

  test("점도 지운다", () => {
    expect(digitsOnly("4.2")).toBe("42");
  });
});

describe("formatBirthday", () => {
  test("치는 대로 구분점을 넣는다", () => {
    expect(formatBirthday("2003")).toBe("2003");
    expect(formatBirthday("200310")).toBe("2003. 10");
    expect(formatBirthday("20031029")).toBe("2003. 10. 29");
  });

  test("여덟 자를 넘기지 않는다", () => {
    expect(formatBirthday("2003102999")).toBe("2003. 10. 29");
  });

  test("이미 구분점이 있어도 다시 맞춘다", () => {
    expect(formatBirthday("2003. 10. 2")).toBe("2003. 10. 2");
  });

  test("숫자가 아닌 것은 들어가지 않는다", () => {
    expect(formatBirthday("이천삼년")).toBe("");
  });
});
