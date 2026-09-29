// 아이 정보 입력칸이 받는 글자. QA 시트에 적힌 값을 그대로 넣어 본다 (#524).
import { describe, expect, test } from "vitest";

import { toAgeInput, toPetNameInput, toWeightInput } from "./profile-input";

describe("toPetNameInput", () => {
  // QA No.187·230
  test("이모티콘을 걷어 내고 숫자는 남긴다", () => {
    expect(toPetNameInput("초코🐶😀")).toBe("초코");
    expect(toPetNameInput("우지빌12😭")).toBe("우지빌12");
  });

  // 그림만 지우면 보이지 않는 이음 글자(U+200D)와 변형 선택자(U+FE0F)가 이름에 남는다
  test("여러 글자로 이어진 이모티콘도 남김없이 걷어 낸다", () => {
    expect(toPetNameInput("코코🙇‍♂️")).toBe("코코");
    expect(toPetNameInput("코코👍🏽")).toBe("코코");
    expect(toPetNameInput("코코🇰🇷")).toBe("코코");
    expect(toPetNameInput("코코❤️")).toBe("코코");
  });

  test("한글·영문·숫자·띄어쓰기는 그대로 둔다", () => {
    expect(toPetNameInput("Coco 2세 보리")).toBe("Coco 2세 보리");
  });
});

describe("toAgeInput", () => {
  // QA No.233
  test("숫자 말고는 들어가지 않는다", () => {
    expect(toAgeInput("221asdf12@@#🙇‍♂️")).toBe("22");
    expect(toAgeInput("4살")).toBe("4");
  });

  // QA No.196. 999999세가 들어가 다음 단계가 켜졌다
  test("두 자리까지만 받는다", () => {
    expect(toAgeInput("999999")).toBe("99");
  });
});

describe("toWeightInput", () => {
  // QA No.206·242
  test("소수 첫째 자리까지만 받는다", () => {
    expect(toWeightInput("4.567")).toBe("4.5");
    expect(toWeightInput("10.11111")).toBe("10.1");
    expect(toWeightInput("30")).toBe("30");
  });

  test("숫자와 소수점 말고는 들어가지 않는다", () => {
    expect(toWeightInput("4키로")).toBe("4");
    expect(toWeightInput("4.2kg")).toBe("4.2");
  });

  // "4.23"으로 이어 붙이면 사용자가 적지 않은 몸무게가 된다
  test("소수점이 둘 이상이면 첫 소수부까지만 남긴다", () => {
    expect(toWeightInput("4.2.3")).toBe("4.2");
  });

  test("치는 중인 모양은 그대로 둔다", () => {
    expect(toWeightInput("4.")).toBe("4.");
    expect(toWeightInput(".5")).toBe(".5");
  });
});
