// 상품 상세 화면이 그릴 값. API 계약이 정해지기 전까지 쓰는 목데이터다.
//
// 적합도 점수·추천 근거·영양 성분 판정은 전부 서버가 계산해 내려줄 값이다(#123).
// 아이마다 결과가 달라지므로 아이를 키로 나눠 둔다 — 한 벌만 두면 아이를 바꿔도
// 같은 근거가 나와서, 이 화면이 무엇을 보여주려는 것인지 확인할 수 없다.

/** 추천 근거 한 줄. 도움이 되는 것과 지켜볼 것을 갈라 읽힌다 */
export type MatchReason = {
  tone: "good" | "caution";
  text: string;
};

/** 영양 성분 한 줄. 절대 기준이 없는 성분은 구간을 재지 않는다 */
export type Nutrient = {
  name: string;
  /** 화면에 적히는 값. "28%"처럼 단위를 포함한다 */
  valueLabel: string;
  /** 막대 위 값의 자리. 0~1 */
  position: number;
  /** 적정 구간의 시작과 끝. 0~1. 기준이 없으면 생략한다 */
  properRange?: [number, number];
};

export type PetMatch = {
  petId: string;
  /** 0~100. 영양 정보가 없어 재지 못했으면 null */
  score: number | null;
  /** "말티즈 · 8세 · 4kg" */
  profileLabel: string;
  reasons: MatchReason[];
  nutrients: Nutrient[];
  /** 기능성 성분 요약. "관절 건강 · 피부 보습 · 면역력" */
  functions: string;
  /** 종합 한 줄. 점수를 재지 못했으면 없다 */
  summary: string | null;
};

export type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  unitLabel: string;
  unitAmount: number;
  rating: number;
  reviewCount: number;
};

export const MOCK_PETS = [
  { id: "1", name: "소리" },
  { id: "2", name: "냥이" },
];

export const MOCK_PRODUCT = {
  name: "면역 지원 영양제 90정",
  price: 21_000,
  originalPrice: 30_000,
  rating: 4.8,
  reviewCount: 108,
  seller: "골라주개냥",
  shipping: "빠름출발 · 14시 이전 주문 시 당일 발송(이후 주문 시 내일 이내 발송)",
  shippingFee: "무료배송 · 조건 미충족 시 3,000원",
  /** 이미지가 아직 없다. 몇 장인지만 알고 자리를 잡는다 */
  imageCount: 3,
  spec: [
    ["제조사/브랜드", "대한펫푸드 / 포포도그"],
    ["제조국", "대한민국"],
    ["제품 용량", "90정 / 병"],
    ["원재료명", "타우린, 글루코사민, MSM, 오메가3 복합체 등"],
    ["급여 대상", "8세 이상 소형·중형견"],
    ["급여 방법", "1일 1정, 사료와 함께 급여"],
    ["알레르기 정보", "계란 · 유제품 불포함"],
    ["소비기한", "제조일로부터 18개월"],
    ["보관방법", "직사광선을 피해 서늘하고 건조한 곳에 보관"],
  ] as const,
  notice: [
    ["품명 및 모델명", "면역 지원 영양제 90정"],
    ["수입식품 여부", "해당 없음"],
    ["소비자상담 관련 전화번호", "1234-5678"],
  ] as const,
};

export const RELATED_PRODUCTS: RelatedProduct[] = [
  {
    id: "2",
    name: "그레인프리 연어 사료 2kg",
    price: 31_200,
    originalPrice: 38_000,
    unitLabel: "하루 예상 급여비 약",
    unitAmount: 1_050,
    rating: 4.8,
    reviewCount: 108,
  },
  {
    id: "3",
    name: "저자극 덴탈껌 14개입",
    price: 10_800,
    originalPrice: 13_100,
    unitLabel: "1개당",
    unitAmount: 771,
    rating: 4.9,
    reviewCount: 203,
  },
  {
    id: "4",
    name: "관절 케어 트릿 200g",
    price: 9_750,
    originalPrice: 12_500,
    unitLabel: "1일 섭취 기준 약",
    unitAmount: 195,
    rating: 4.7,
    reviewCount: 64,
  },
];

/**
 * 아이별 적합도. 같은 상품이라도 아이에 따라 결과가 갈린다.
 *
 * 냥이는 점수가 없다. 이 영양제가 강아지용이라 고양이 기준으로는 재지 못한 것으로,
 * 0점이 아니라 "정보 확인 중"으로 읽혀야 한다(#119).
 */
export const PET_MATCHES: PetMatch[] = [
  {
    petId: "1",
    score: 92,
    profileLabel: "말티즈 · 8세 · 4kg",
    reasons: [
      { tone: "good", text: "관절 건강에 도움되는 글루코사민이 들어있어요" },
      { tone: "good", text: "소리에게 등록된 알레르기 유발 성분이 없어요" },
      { tone: "caution", text: "나트륨 함량이 또래 평균보다 다소 높은 편이에요" },
    ],
    nutrients: [
      { name: "단백질", valueLabel: "28%", position: 0.5, properRange: [0.33, 0.67] },
      { name: "지방", valueLabel: "12%", position: 0.86, properRange: [0.3, 0.6] },
      { name: "조섬유", valueLabel: "5%", position: 0.46, properRange: [0.33, 0.7] },
      { name: "오메가3", valueLabel: "3%", position: 0.54 },
    ],
    functions: "관절 건강 · 피부 보습 · 면역력",
    summary: "소리에게 꾸준히 급여하기 좋은 상품이에요",
  },
  {
    petId: "2",
    score: null,
    profileLabel: "코리안 숏헤어 · 3세 · 4.2kg",
    reasons: [{ tone: "caution", text: "고양이 급여 기준이 등록되지 않아 아직 재지 못했어요" }],
    nutrients: [],
    functions: "관절 건강 · 피부 보습 · 면역력",
    summary: null,
  },
];
