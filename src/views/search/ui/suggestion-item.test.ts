// 어디를 강조할지 나누는 규칙. 겹치는 자리가 앞·중간·끝일 때를 모두 본다.
import { describe, expect, it } from "vitest";

import { splitByKeyword } from "./suggestion-item";

describe("splitByKeyword", () => {
  it("맨 앞에서 겹치면 앞이 비고 뒤가 남는다", () => {
    expect(splitByKeyword("중소형견 사료", "중소형")).toEqual({
      before: "",
      match: "중소형",
      after: "견 사료",
    });
  });

  it("가운데서 겹치면 앞뒤가 모두 남는다", () => {
    expect(splitByKeyword("노령견 저지방 사료", "저지방")).toEqual({
      before: "노령견 ",
      match: "저지방",
      after: " 사료",
    });
  });

  it("겹치는 곳이 없으면 통째로 앞에 둔다", () => {
    expect(splitByKeyword("양치 껌", "사료")).toEqual({
      before: "양치 껌",
      match: "",
      after: "",
    });
  });

  it("입력이 비면 강조하지 않는다", () => {
    expect(splitByKeyword("양치 껌", "   ")).toEqual({
      before: "양치 껌",
      match: "",
      after: "",
    });
  });

  it("대소문자가 달라도 찾고, 강조는 원문 그대로 둔다", () => {
    // 입력한 대소문자로 바꿔 쓰면 추천어가 달라 보인다
    expect(splitByKeyword("ROYAL 사료", "royal")).toEqual({
      before: "",
      match: "ROYAL",
      after: " 사료",
    });
  });

  it("앞뒤 공백은 떼고 찾는다", () => {
    expect(splitByKeyword("중소형견 사료", "  사료  ")).toEqual({
      before: "중소형견 ",
      match: "사료",
      after: "",
    });
  });
});
