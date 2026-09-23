// 반려동물 프로필의 선택지와 초안 모양.
//
// **품종 목록은 여기 없다.** 백엔드가 `GET /pets/breeds`로 주고, 등록 API가 이름이 아니라
// `breedId`를 받으므로 서버가 준 id를 그대로 써야 한다. 조회는 `api/breeds.ts`에 있다.

export const PET_SPECIES = ["dog", "cat"] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "강아지",
  cat: "고양이",
};

/** 백엔드 `Species` enum. 조회·등록 모두 이 값으로 주고받는다 */
export const SPECIES_PARAM: Record<PetSpecies, "DOG" | "CAT"> = {
  dog: "DOG",
  cat: "CAT",
};

export const GENDER_OPTIONS = [
  { value: "male", label: "남자아이" },
  { value: "female", label: "여자아이" },
] as const;

export const NEUTERED_OPTIONS = [
  { value: "yes", label: "했어요" },
  { value: "no", label: "안 했어요" },
] as const;

/** UI 시안(onbo_003)에서 종을 가리지 않는 문구로 확정됐다 */
export const SIZE_OPTIONS = [
  { value: "small", label: "소형" },
  { value: "medium", label: "중형" },
  { value: "large", label: "대형" },
] as const;

/**
 * 체구를 무엇으로 가르는지. 물음표를 누르면 보인다. 강아지 기준이다 — 고양이는 체구를 묻지 않는다(#391).
 * 초소형견은 안내에만 있고 선택지는 소형·중형·대형 셋이라, 4kg 미만은 소형을 고르면 된다
 */
export const SIZE_GUIDE = [
  "초소형견은 4kg 미만",
  "소형견은 4~10kg",
  "중형견은 10~25kg",
  "대형견은 25kg 이상이에요",
] as const;

/** 시안 onbo_003_체구선택후의 슬라이더 5단계 */
export const BODY_TYPE_OPTIONS = ["매우 마름", "마름", "보통", "통통", "비만"] as const;
export const DEFAULT_BODY_TYPE_INDEX = 2;

export type PetProfileDraft = {
  photo: File | null;
  name: string;
  gender: string;
  neutered: string;
  species: PetSpecies;
  /** 고른 품종의 서버 id. 등록 요청이 이 값을 받는다. 안 골랐으면 null */
  breedId: number | null;
  /** 화면에 보일 품종 이름. 목록을 다시 받기 전에도 고른 것이 보여야 한다 */
  breedName: string;
  age: string;
  birthday: string;
  size: string;
  weight: string;
  bodyTypeIndex: number;
  /** 고른 건강 관심사. 여러 개를 고를 수 있어 배열이다 */
  concern: string[];
  noConcern: boolean;
  /** 고른 알러지 성분 */
  allergy: string[];
  noAllergy: boolean;
};

export const EMPTY_PROFILE_DRAFT: PetProfileDraft = {
  photo: null,
  name: "",
  gender: "",
  neutered: "",
  species: "dog",
  breedId: null,
  breedName: "",
  age: "",
  birthday: "",
  size: "",
  weight: "",
  bodyTypeIndex: DEFAULT_BODY_TYPE_INDEX,
  concern: [],
  noConcern: false,
  allergy: [],
  noAllergy: false,
};

/** 체형 다섯 단계가 각각 무엇인지. 만져서 판단하는 기준이라 설명이 없으면 고를 수 없다. */
export const BODY_TYPE_GUIDE: Record<(typeof BODY_TYPE_OPTIONS)[number], string> = {
  "매우 마름": "뼈가 뚜렷하게 보이고 살집이 거의 없어요",
  마름: "뼈가 쉽게 만져지고 허리가 쏙 들어갔어요",
  보통: "뼈가 부드럽게 만져지는 건강한 체형이에요",
  통통: "힘주어 만져야 뼈가 느껴지고 허리선이 없어요",
  비만: "살집 때문에 뼈가 안 만져지고 배가 나왔어요",
};
