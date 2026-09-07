// 반려동물 품종 목록과 프로필 선택지.
// 품종은 기능명세서 v0.4의 `데이터 구조`에 확정 데이터가 있어 그것을 옮겼다.
// 백엔드 API 계약이 정해지면 서버에서 받아오는 것으로 바꾼다 — 그때 이 파일만 손대면 된다.

export const PET_SPECIES = ["dog", "cat"] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "강아지",
  cat: "고양이",
};

/** 기능명세서 v0.4 `데이터 구조`의 품종 선택 데이터. 시안이 아니라 이쪽이 정본이다 */
export const BREEDS: Record<PetSpecies, string[]> = {
  dog: [
    "말티즈",
    "말티푸",
    "토이 푸들",
    "스탠다드 푸들",
    "미니어처 푸들",
    "비숑 프리제",
    "포메라니안",
    "스피츠",
    "폼피츠",
    "이탈리안 그레이하운드",
    "치와와",
    "시츄",
    "페키니즈",
    "파피용",
    "베드리턴 테리어",
    "요크셔테리어",
    "미니어처 슈나우저",
    "닥스훈트",
    "웰시코기",
    "프렌치 불도그",
    "퍼그",
    "비글",
    "코커 스패니얼",
    "시바견",
    "진돗개",
    "골든 리트리버",
    "래브라도 리트리버",
    "보더콜리",
    "사모예드",
    "허스키",
    "셰틀랜드 쉽독",
    "보스턴테리어",
    "불독",
    "믹스견",
    "기타",
  ],
  cat: [
    "코리안 숏헤어",
    "페르시안",
    "러시안 블루",
    "샴",
    "아메리칸 숏헤어",
    "브리티시 숏헤어",
    "스코티시 폴드",
    "스코티시 스트레이트",
    "스코티시 킬트",
    "먼치킨",
    "노르웨이 숲",
    "데본렉스",
    "미누엣 (나폴레옹)",
    "메인쿤",
    "랙돌",
    "벵갈",
    "아비시니안",
    "터키시 앙고라",
    "스핑크스",
    "엑조틱 숏헤어",
    "셀커크 렉스",
    "믹스묘",
    "기타",
  ],
};

export const GENDER_OPTIONS = [
  { value: "male", label: "남자아이" },
  { value: "female", label: "여자아이" },
] as const;

export const NEUTERED_OPTIONS = [
  { value: "yes", label: "했어요" },
  { value: "no", label: "안 했어요" },
] as const;

/** 시안은 견종 기준 문구다. 고양이는 체급 표현이 다를 수 있어 확인이 필요하다 */
export const SIZE_OPTIONS = [
  { value: "small", label: "소형견", description: "10kg 미만" },
  { value: "medium", label: "중형견", description: "10kg ~ 25kg" },
  { value: "large", label: "대형견", description: "25kg 이상" },
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
  breed: string;
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
  breed: "",
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

/**
 * 고른 품종이 어느 종의 것인지 되찾는다. 종을 강아지로 고정하면 고양이 선택이 뒤집힌다.
 *
 * "기타"는 양쪽 목록에 다 있어 이름만으로는 가를 수 없다. 프로필에 이미 종이 있으면
 * `hint`로 넘긴다 — 넘기지 않으면 고양이로 저장한 "기타"가 강아지로 뒤집힌다.
 */
export function findSpecies(breed: string, hint?: PetSpecies): PetSpecies {
  if (hint && BREEDS[hint].includes(breed)) return hint;
  return PET_SPECIES.find((species) => BREEDS[species].includes(breed)) ?? "dog";
}

/** 체형 다섯 단계가 각각 무엇인지. 만져서 판단하는 기준이라 설명이 없으면 고를 수 없다. */
export const BODY_TYPE_GUIDE: Record<(typeof BODY_TYPE_OPTIONS)[number], string> = {
  "매우 마름": "뼈가 뚜렷하게 보이고 살집이 거의 없어요",
  마름: "뼈가 쉽게 만져지고 허리가 쏙 들어갔어요",
  보통: "뼈가 부드럽게 만져지는 건강한 체형이에요",
  통통: "힘주어 만져야 뼈가 느껴지고 허리선이 없어요",
  비만: "살집 때문에 뼈가 안 만져지고 배가 나왔어요",
};
