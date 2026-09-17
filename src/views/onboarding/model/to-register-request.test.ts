// 초안을 등록 요청으로 옮기는 규칙. 화면 값과 API 값의 모양이 거의 다 달라 하나씩 본다.
import { describe, expect, test } from "vitest";

import { EMPTY_PROFILE_DRAFT, type PetProfileDraft } from "@/entities/pet";

import { parseAge, parseBirthDate, parseWeight, toRegisterRequest } from "./to-register-request";

/** 필수를 다 채운 초안. 각 테스트가 필요한 칸만 덮어쓴다 */
const FILLED: PetProfileDraft = {
  ...EMPTY_PROFILE_DRAFT,
  name: "코코",
  gender: "female",
  neutered: "yes",
  species: "dog",
  breedId: 1,
  breedName: "말티즈",
  age: "4",
  size: "small",
  weight: "4.2",
  bodyTypeIndex: 2,
};

describe("parseWeight", () => {
  // 자유 입력이라 단위가 섞여 들어온다. API는 double이다
  test("단위가 붙어도 숫자만 뽑는다", () => {
    expect(parseWeight("4키로")).toBe(4);
    expect(parseWeight("5 kg")).toBe(5);
    expect(parseWeight("4.2")).toBe(4.2);
  });

  test("숫자가 없으면 null이다", () => {
    expect(parseWeight("")).toBeNull();
    expect(parseWeight("모르겠어요")).toBeNull();
  });

  // API가 @Positive라 0은 거절당한다. 보내기 전에 막는다
  test("0 이하는 null이다", () => {
    expect(parseWeight("0")).toBeNull();
    expect(parseWeight("0kg")).toBeNull();
  });
});

describe("parseBirthDate", () => {
  test("어떤 구분자로 적어도 YYYY-MM-DD가 된다", () => {
    expect(parseBirthDate("2022-03-15")).toBe("2022-03-15");
    expect(parseBirthDate("2022. 03. 15")).toBe("2022-03-15");
    expect(parseBirthDate("20220315")).toBe("2022-03-15");
  });

  // 생일은 선택이라 못 알아들으면 안 보내면 된다
  test("숫자 여덟 자가 아니면 null이다", () => {
    expect(parseBirthDate("")).toBeNull();
    expect(parseBirthDate("2022")).toBeNull();
    expect(parseBirthDate("2022-3-1")).toBeNull();
  });
});

describe("parseAge", () => {
  test("단위가 붙어도 숫자만 뽑는다", () => {
    expect(parseAge("4")).toBe(4);
    expect(parseAge("4세")).toBe(4);
    expect(parseAge("4살")).toBe(4);
  });

  test("숫자가 없거나 0이면 null이다", () => {
    expect(parseAge("")).toBeNull();
    expect(parseAge("0")).toBeNull();
  });
});

describe("toRegisterRequest", () => {
  test("화면 값을 API가 받는 모양으로 옮긴다", () => {
    expect(toRegisterRequest(FILLED)).toEqual({
      name: "코코",
      sex: "FEMALE",
      isNeutered: true,
      species: "DOG",
      age: 4,
      size: "SMALL",
      weight: 4.2,
      bcs: 3,
      breedId: 1,
      healthConcerns: [],
      allergies: [],
    });
  });

  // 슬라이더는 0부터, API는 1부터 센다
  test("체형은 한 칸 올려 보낸다", () => {
    expect(toRegisterRequest({ ...FILLED, bodyTypeIndex: 0 })?.bcs).toBe(1);
    expect(toRegisterRequest({ ...FILLED, bodyTypeIndex: 4 })?.bcs).toBe(5);
  });

  test("중성화를 안 했으면 false로 보낸다", () => {
    expect(toRegisterRequest({ ...FILLED, neutered: "no" })?.isNeutered).toBe(false);
  });

  test("생일을 적었으면 함께 보내고 아니면 아예 뺀다", () => {
    expect(toRegisterRequest({ ...FILLED, birthday: "2022.03.15" })?.birthDate).toBe("2022-03-15");
    expect(toRegisterRequest(FILLED)).not.toHaveProperty("birthDate");
  });

  test("고른 질환과 알레르기를 그대로 싣는다", () => {
    const request = toRegisterRequest({
      ...FILLED,
      concern: ["슬개골 탈구"],
      allergy: ["CHICKEN"],
    });

    expect(request?.healthConcerns).toEqual(["슬개골 탈구"]);
    expect(request?.allergies).toEqual(["CHICKEN"]);
  });

  // 앞서 골라 둔 것이 "해당 없음"을 켠 뒤에도 흘러가면 추천 근거가 거짓이 된다
  test("해당 없음을 켰으면 골라 둔 것이 있어도 비워 보낸다", () => {
    const request = toRegisterRequest({
      ...FILLED,
      concern: ["슬개골 탈구"],
      noConcern: true,
      allergy: ["CHICKEN"],
      noAllergy: true,
    });

    expect(request?.healthConcerns).toEqual([]);
    expect(request?.allergies).toEqual([]);
  });

  // 업로드 엔드포인트가 없어 URL을 만들 수 없다(#226)
  test("사진은 보내지 않는다", () => {
    const request = toRegisterRequest({
      ...FILLED,
      photo: new File([""], "코코.png", { type: "image/png" }),
    });

    expect(request).not.toHaveProperty("image");
  });

  test("이름 앞뒤 공백을 떼고 보낸다", () => {
    expect(toRegisterRequest({ ...FILLED, name: "  코코  " })?.name).toBe("코코");
  });

  describe("필수가 비면 null이다", () => {
    const cases: [string, Partial<PetProfileDraft>][] = [
      ["이름", { name: "   " }],
      ["성별", { gender: "" }],
      ["중성화", { neutered: "" }],
      ["체구", { size: "" }],
      ["품종", { breedId: null }],
      ["나이", { age: "" }],
      ["몸무게", { weight: "모르겠어요" }],
    ];

    test.each(cases)("%s이 비면 보내지 않는다", (_label, patch) => {
      expect(toRegisterRequest({ ...FILLED, ...patch })).toBeNull();
    });
  });
});
