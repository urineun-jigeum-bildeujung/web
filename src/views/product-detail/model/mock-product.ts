// 상품 상세 화면에서 아직 목으로 남는 값. 상품 자체는 실 API로 온다(#413).
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
  /** 근거 문장에 이름이 박히므로 적합도와 같은 자리에 둔다 */
  petName: string;
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

/** 상품 하나는 한 시점에 이 중 하나다. 타임딜이면서 동시에 품절인 상태는 다루지 않는다 */
export type ProductStatus = "normal" | "deal" | "soldout";

/** 타임딜 종료 시각. 실제로는 서버가 준다 */
export const DEAL_ENDS_AT = new Date(Date.now() + 2 * 3600_000 + 14 * 60_000 + 33_000);

/**
 * 아직 API 계약이 없어 목으로 남는 값들(#413).
 *
 * 상품 자체(이름·가격·별점·품절·스펙)는 `GET /products/{id}`에서 온다. 여기 남은 셋은
 * 그 응답에 자리가 없는 것들이다 — 어느 상품을 열어도 같은 값이므로 계약이 생기면
 * 지운다. 배송비만은 목이 아니라 **확정된 고정 정책**이다.
 */
export const MOCK_PRODUCT = {
  seller: "골라주개냥",
  shipping: "빠름출발 · 14시 이전 주문 시 당일 발송(이후 주문 시 내일 이내 발송)",
  /**
   * 배송비는 MVP에서 3,000원 고정이다. 백엔드가 "MVP 단계에선 배송비는 정적으로
   * 고정한다"고 답했고(2026-09-21) 장바구니·결제도 같은 값을 물린다(#214).
   * 예전 문구("무료배송 · 조건 미충족 시 3,000원")는 근거가 없어 두 화면과 어긋났다.
   */
  shippingFee: "3,000원",
};

/**
 * 적합도의 예시 분석. 점수·근거 두 줄·영양 성분은 AI가 계산해 줄 값이라 그 전까지 예시로 둔다.
 *
 * **아이 이름은 넣지 않는다.** 예시 아이("소리")의 이름을 근거에 박아 두던 동안, 내 아이가
 * 누구든 남의 이름이 떴다 (#481). 이름·프로필·알레르기 근거는 `toPetMatch`가 실제 아이로 채운다.
 */
export const EXAMPLE_ANALYSIS: {
  score: number;
  goodReason: MatchReason;
  cautionReason: MatchReason;
  nutrients: Nutrient[];
  functions: string;
} = {
  score: 92,
  goodReason: { tone: "good", text: "관절 건강에 도움되는 글루코사민이 들어있어요" },
  cautionReason: { tone: "caution", text: "나트륨 함량이 또래 평균보다 다소 높은 편이에요" },
  nutrients: [
    { name: "단백질", valueLabel: "28%", position: 0.5, properRange: [0.33, 0.67] },
    { name: "지방", valueLabel: "12%", position: 0.86, properRange: [0.3, 0.6] },
    { name: "조섬유", valueLabel: "5%", position: 0.46, properRange: [0.33, 0.7] },
    { name: "오메가3", valueLabel: "3%", position: 0.54 },
  ],
  functions: "관절 건강 · 피부 보습 · 면역력",
};
