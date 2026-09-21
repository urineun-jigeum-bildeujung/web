// 품종을 체구그룹으로 묶는 화면 쪽 상수. 리뷰 필터의 품종 선택 화면(#264)에서만 쓴다.
//
// **서버 값이 아니라 참고 자료다.** `GET /pets/breeds`는 종별 평면 목록만 주고 체구
// 분류가 없다(#150). 어떤 품종이 어느 체구인지는 PD팀이 정할 값이라 확정 Figma를 받을
// 때까지 성견 평균 체중 기준의 이 표로 대신한다. 실제 분류가 달라지면 이 파일만
// 갈아끼우면 된다.

import type { PetSpecies } from "./breeds";

type BodyGroup = {
  label: string;
  /** 이 그룹에 속하는 품종 이름. `GET /pets/breeds`가 준 `breedName`과 정규화해 견준다 */
  breedNames: string[];
};

const DOG_BODY_GROUPS: BodyGroup[] = [
  {
    label: "초소형견",
    breedNames: ["치와와", "포메라니안", "요크셔테리어", "말티즈", "토이푸들", "파피용", "미니핀"],
  },
  {
    label: "소형견",
    breedNames: [
      "시츄",
      "비숑프리제",
      "미니어처푸들",
      "미니어처닥스훈트",
      "페키니즈",
      "프렌치불도그",
      "웨스트하이랜드화이트테리어",
    ],
  },
  {
    label: "중형견",
    breedNames: [
      "비글",
      "시바견",
      "웰시코기",
      "코카스파니엘",
      "스탠다드닥스훈트",
      "보더콜리",
      "슈나우저(스탠다드)",
      "불도그",
      "시베리안허스키",
    ],
  },
  {
    label: "대형견",
    breedNames: [
      "골든리트리버",
      "래브라도리트리버",
      "저먼셰퍼드",
      "스탠다드푸들",
      "사모예드",
      "그레이트데인",
    ],
  },
  {
    // 하위 품종이 없다 — API가 "믹스"류 품종을 내려주면 이 그룹이 그대로 받는다
    label: "믹스견",
    breedNames: ["믹스", "믹스견"],
  },
];

const CAT_BODY_GROUPS: BodyGroup[] = [
  {
    label: "소형묘",
    breedNames: ["싱가푸라", "먼치킨", "코니시렉스", "데본렉스", "샴", "터키시앙고라"],
  },
  {
    label: "중형묘",
    breedNames: [
      "코리안숏헤어",
      "러시안블루",
      "스코티시폴드",
      "아메리칸숏헤어",
      "브리티시숏헤어",
      "페르시안",
      "아비시니안",
      "스핑크스",
      "벵갈",
    ],
  },
  {
    label: "대형묘",
    breedNames: ["메인쿤", "랙돌", "노르웨이숲고양이", "사바나캣"],
  },
  {
    label: "믹스묘",
    breedNames: ["믹스", "믹스묘"],
  },
];

const OTHER_GROUP_LABEL = "기타";

/** 띄어쓰기와 대소문자를 무시하고 견준다. breed-picker.tsx의 검색 정규화와 같은 규칙이다 */
function normalize(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

export type BodySizeGroup<T> = {
  label: string;
  breeds: T[];
};

/** 표에 없는 품종(표기 차이·신규 품종)은 사라지지 않도록 맨 뒤 "기타" 그룹에 모은다 —
    실제로 남는 품종이 있을 때만 그 그룹을 만든다 */
export function groupBreedsByBodySize<T extends { breedName: string }>(
  species: PetSpecies,
  breeds: T[],
): BodySizeGroup<T>[] {
  const table = species === "dog" ? DOG_BODY_GROUPS : CAT_BODY_GROUPS;
  const matched = new Set<T>();

  const groups = table.map(({ label, breedNames }) => {
    const names = new Set(breedNames.map(normalize));
    const items = breeds.filter((breed) => names.has(normalize(breed.breedName)));
    items.forEach((breed) => matched.add(breed));
    return { label, breeds: items };
  });

  const rest = breeds.filter((breed) => !matched.has(breed));
  if (rest.length > 0) groups.push({ label: OTHER_GROUP_LABEL, breeds: rest });

  return groups;
}
