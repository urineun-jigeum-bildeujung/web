// 품종을 체구그룹으로 나누는 규칙. 정상 매칭·표기 차이·믹스·미매칭 기타 처리를 본다.
import { describe, expect, it } from "vitest";

import { groupBreedsByBodySize } from "./body-groups";

type Breed = { id: number; breedName: string };

describe("groupBreedsByBodySize", () => {
  it("품종을 체구그룹으로 나눈다", () => {
    const breeds: Breed[] = [
      { id: 1, breedName: "말티즈" },
      { id: 2, breedName: "비글" },
      { id: 3, breedName: "골든리트리버" },
    ];

    const groups = groupBreedsByBodySize("dog", breeds);

    expect(groups.find((group) => group.label === "초소형견")?.breeds).toEqual([
      { id: 1, breedName: "말티즈" },
    ]);
    expect(groups.find((group) => group.label === "중형견")?.breeds).toEqual([
      { id: 2, breedName: "비글" },
    ]);
    expect(groups.find((group) => group.label === "대형견")?.breeds).toEqual([
      { id: 3, breedName: "골든리트리버" },
    ]);
  });

  it("공백·대소문자 차이는 같은 품종으로 본다", () => {
    const breeds: Breed[] = [{ id: 1, breedName: "웨스트 하이랜드 화이트 테리어" }];

    const groups = groupBreedsByBodySize("dog", breeds);

    expect(groups.find((group) => group.label === "소형견")?.breeds).toEqual(breeds);
  });

  it("표에 매칭되는 품종이 없어도 다섯 그룹이 모두 보인다", () => {
    const groups = groupBreedsByBodySize("dog", []);

    expect(groups.map((group) => group.label)).toEqual([
      "초소형견",
      "소형견",
      "중형견",
      "대형견",
      "믹스견",
    ]);
    groups.forEach((group) => expect(group.breeds).toEqual([]));
  });

  it("믹스견은 하위 품종 없이 API의 믹스 품종을 그대로 받는다", () => {
    const breeds: Breed[] = [{ id: 9, breedName: "믹스견" }];

    const groups = groupBreedsByBodySize("dog", breeds);

    expect(groups.find((group) => group.label === "믹스견")?.breeds).toEqual(breeds);
  });

  it("표에 없는 품종은 사라지지 않고 기타 그룹에 모인다", () => {
    const breeds: Breed[] = [
      { id: 1, breedName: "말티즈" },
      { id: 99, breedName: "쿠바리안트리도그" },
    ];

    const groups = groupBreedsByBodySize("dog", breeds);

    expect(groups.at(-1)).toEqual({
      label: "기타",
      breeds: [{ id: 99, breedName: "쿠바리안트리도그" }],
    });
  });

  it("기타로 갈 품종이 없으면 기타 그룹 자체를 만들지 않는다", () => {
    const groups = groupBreedsByBodySize("dog", [{ id: 1, breedName: "말티즈" }]);

    expect(groups.some((group) => group.label === "기타")).toBe(false);
  });

  it("고양이는 소형·중형·대형·믹스 네 그룹이다", () => {
    const groups = groupBreedsByBodySize("cat", [{ id: 1, breedName: "러시안블루" }]);

    expect(groups.map((group) => group.label)).toEqual(["소형묘", "중형묘", "대형묘", "믹스묘"]);
    expect(groups.find((group) => group.label === "중형묘")?.breeds).toEqual([
      { id: 1, breedName: "러시안블루" },
    ]);
  });
});
