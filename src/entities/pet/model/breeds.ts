// 반려동물 품종 목록과 프로필 선택지. 와이어프레임(onbo_002~004)에 적힌 값을 그대로 옮겼다.
// 백엔드 API 계약이 정해지면 서버에서 받아오는 것으로 바꾼다.

export const PET_SPECIES = ["dog", "cat"] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "강아지",
  cat: "고양이",
};

/** 시안 onbo_003_품종선택에 나열된 품종 */
export const BREEDS: Record<PetSpecies, string[]> = {
  dog: [
    "골든 리트리버",
    "닥스훈트",
    "달마시안",
    "도베르만",
    "말티즈",
    "믹스견 (기타)",
    "보더콜리",
    "보스턴 테리어",
    "비숑 프리제",
    "비글",
    "사모예드",
    "시바견",
    "시베리안 허스키",
    "시츄",
    "요크셔 테리어",
    "웰시코기",
    "진돗개",
    "치와와",
    "코카 스파니엘",
    "퍼그",
    "포메라니안",
    "푸들",
    "프렌치 불독",
  ],
  cat: [
    "노르웨이 숲",
    "랙돌",
    "러시안 블루",
    "먼치킨",
    "메인쿤",
    "믹스묘 (기타)",
    "뱅갈",
    "브리티시 숏헤어",
    "샴",
    "스코티시 폴드",
    "스핑크스",
    "아비시니안",
    "코리안 숏헤어 (코숏)",
    "터키시 앙고라",
    "페르시안",
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
  concern: string;
  noConcern: boolean;
  allergy: string;
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
  concern: "",
  noConcern: false,
  allergy: "",
  noAllergy: false,
};
