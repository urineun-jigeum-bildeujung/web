// 추천 API(AI팀 v3.0.0)의 snake_case 응답을 화면이 쓰는 camelCase 추천 상품으로 옮긴다.
//
// 명세와 화면이 다른 값은 AI팀 답을 기다리지 않고 여기서 바꿔 쓴다(#600). 규칙이 한곳에 있어야
// 명세가 바뀌었을 때 이 파일만 고치면 된다.

import { formatWon } from "@/shared/ui/price/price";

/** 화면이 거르는 분류. 전체는 분류를 보내지 않는다 */
export type RecommendationCategory = "food" | "snack" | "supplement";

/** 추천 API가 받는 분류. 간식이 `snack`이 아니라 `treat`다 */
export type ApiRecommendationCategory = "food" | "treat" | "supplement";

/** 카드가 가르는 판매 상태 */
export type SaleStatus = "onSale" | "soldOut" | "timeDeal";

/** `POST /recommend/home` 응답의 항목 하나. 명세 v3.0.0(2026-09-30) 그대로다 */
export type RecommendationItemResponse = {
  product_id: number;
  rank: number;
  /** 0~100. 예전 방식(0~1)이나 값이 빠진 응답에도 버티도록 받는다 */
  score?: number | null;
  reason_text: string;
  /** `SAFE`·`PENALIZED`(알레르기 성분과 겹쳐 70% 감점)·`PENDING`(성분 분석 전, 30% 감점) */
  allergy_status: string;
  /** 겹친 성분 코드. 사람이 읽을 이름으로 바꿀 표가 없어 화면에 쓰지 않는다 */
  matched_allergen: string[];
  product_name: string;
  thumbnail_url: string;
  /** `FOOD`·`TREAT`·`SUPPLEMENT` */
  category: string;
  price: number;
  original_price: number;
  unit_price: number;
  /** `"1000G"`처럼 양과 단위가 붙어 온다 */
  unit_label: string;
  rating: number;
  review_count: number;
  sales_count: number;
  /** `ON_SALE` 등. 값 목록이 명세에 없다 */
  status: string;
  created_at: string;
};

/** `POST /recommend/home` 응답. `pet_name`은 쓰지 않는다 — 이름은 아이 목록(`/members/me/pets`)의 것을 쓴다 */
export type HomeRecommendationResponse = {
  pet_id: number;
  pet_name: string;
  generated_at: string;
  items: RecommendationItemResponse[];
};

/** 단가 한 줄에 필요한 값. `formatUnitPrice(label, price)`에 그대로 넘긴다 */
export type UnitPrice = {
  /** `g`·`ml`·`개`처럼 단위만 */
  label: string;
  /** 한 단위의 가격(원) */
  price: number;
};

/** 화면이 쓰는 추천 상품 하나 */
export type Recommendation = {
  productId: number;
  /** 서버가 매긴 추천 순서. 추천순은 이 순서 그대로다 */
  rank: number;
  /** 0~100 정수. 재지 못했으면 null — 배지가 "정보 확인 중"으로 읽는다 */
  score: number | null;
  /** 왜 이 아이에게 추천하는지 */
  reason: string;
  /** 아이의 알레르기 성분과 겹쳐 감점된 상품. 목록에서 빠지지 않고 주의 한 줄이 붙는다 */
  allergyPenalized: boolean;
  name: string;
  thumbnailUrl: string;
  /** `food`·`snack`·`supplement`. 모르는 값은 받은 그대로 둔다 */
  category: string;
  price: number;
  originalPrice: number;
  /** 해석할 수 없으면 null — 단가 줄을 그리지 않는다 */
  unitPrice: UnitPrice | null;
  rating: number;
  reviewCount: number;
  status: SaleStatus;
  createdAt: string;
};

const REQUEST_CATEGORY: Record<RecommendationCategory, ApiRecommendationCategory> = {
  food: "food",
  snack: "treat",
  supplement: "supplement",
};

const RESPONSE_CATEGORY: Record<string, RecommendationCategory> = {
  FOOD: "food",
  TREAT: "snack",
  SUPPLEMENT: "supplement",
};

/** 화면 분류 → 요청 분류. 전체(undefined)는 보내지 않는다 */
export function toApiCategory(
  category: RecommendationCategory | undefined,
): ApiRecommendationCategory | undefined {
  return category && REQUEST_CATEGORY[category];
}

/** 응답 분류(`TREAT` 등) → 화면 분류(`snack`). 모르는 값은 버리지 않고 받은 그대로 둔다 */
export function toCategory(category: string): string {
  return RESPONSE_CATEGORY[category.toUpperCase()] ?? category;
}

/**
 * 점수를 0~100 정수로 맞춘다.
 *
 * 0 초과 1 미만의 소수는 예전 0~1 방식으로 보고 100을 곱한다. 정수 0·1은 그대로 0점·1점이다 —
 * 1을 100점으로 올리면 거의 안 맞는 상품이 가장 잘 맞는 상품이 된다. 값이 없으면 null이다
 */
export function toMatchScore(score: number | null | undefined): number | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  const scaled = score > 0 && score < 1 ? score * 100 : score;
  return Math.min(100, Math.max(0, Math.round(scaled)));
}

/** 구분자(`_`·`-`·공백)와 대소문자를 무시하고 견준다. `SOLD_OUT`·`sold-out`·`SoldOut`이 같다 */
function normalizeStatus(status: string) {
  return status.toUpperCase().replace(/[^A-Z]/g, "");
}

const SOLD_OUT_STATUSES = ["SOLDOUT", "OUTOFSTOCK"];
const TIME_DEAL_STATUSES = ["TIMEDEAL", "DEAL"];

/** 판매 상태. 품절·타임딜 류가 아니면 판매 중으로 본다 — 모르는 값으로 상품을 막지 않는다 */
export function toSaleStatus(status: string): SaleStatus {
  const normalized = normalizeStatus(status);
  if (SOLD_OUT_STATUSES.includes(normalized)) return "soldOut";
  if (TIME_DEAL_STATUSES.includes(normalized)) return "timeDeal";
  return "onSale";
}

/**
 * 단가 줄의 값. `"1000G"`에서 양을 떼고 단위만 소문자로 쓴다(`g`). 가격은 원 단위로 반올림한다.
 * 단위를 읽을 수 없거나 반올림한 가격이 1원 미만이면 null이다 — "1g당 0원"은 틀린 말이다
 */
export function toUnitPrice(unitLabel: string, unitPrice: number): UnitPrice | null {
  const match = /^\s*\d*(?:[.,]\d+)?\s*([a-zA-Z가-힣]+)\s*$/.exec(unitLabel);
  if (!match || !Number.isFinite(unitPrice)) return null;
  const price = Math.round(unitPrice);
  if (price < 1) return null;
  return { label: match[1].toLowerCase(), price };
}

/**
 * 단가 줄 문장. 메인 맞춤 상품 시안(1758-68917)의 "1개당 800원" 꼴이다 — `entities/product`의
 * `formatUnitPrice`(타임딜 시안의 "1개당 약 680원")와 달리 "약"이 없다
 */
export function formatUnitPriceLine({ label, price }: UnitPrice): string {
  return `1${label}당 ${formatWon(price)}`;
}

export function toRecommendation(item: RecommendationItemResponse): Recommendation {
  return {
    productId: item.product_id,
    rank: item.rank,
    score: toMatchScore(item.score),
    reason: item.reason_text,
    allergyPenalized: item.allergy_status.toUpperCase() === "PENALIZED",
    name: item.product_name,
    thumbnailUrl: item.thumbnail_url,
    category: toCategory(item.category),
    price: item.price,
    originalPrice: item.original_price,
    unitPrice: toUnitPrice(item.unit_label, item.unit_price),
    rating: item.rating,
    reviewCount: item.review_count,
    status: toSaleStatus(item.status),
    createdAt: item.created_at,
  };
}
