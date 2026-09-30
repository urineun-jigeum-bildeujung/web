// 추천 응답을 화면 값으로 옮기는 규칙(분류·점수·상태·단가)을 본다. 명세와 다른 값을 FE가 바꿔 쓰는 자리다(#600).
import { describe, expect, it } from "vitest";

import {
  formatUnitPriceLine,
  toApiCategory,
  toCategory,
  toMatchScore,
  toRecommendation,
  toSaleStatus,
  toUnitPrice,
  type RecommendationItemResponse,
} from "./recommendation";

const ITEM: RecommendationItemResponse = {
  product_id: 219,
  rank: 1,
  score: 57,
  reason_text: "나와 비슷한 반려동물을 키우는 분들이 남긴 기호성 평가가 좋아 추천합니다.",
  allergy_status: "SAFE",
  matched_allergen: [],
  product_name: "한입 크림 파우치 연어살 20포",
  thumbnail_url: "https://cdn.example/219.jpg",
  category: "TREAT",
  price: 19000,
  original_price: 20000,
  unit_price: 19.0,
  unit_label: "1000G",
  rating: 3.96,
  review_count: 665,
  sales_count: 4717,
  status: "ON_SALE",
  created_at: "2026-09-14T01:58:19+00:00",
};

describe("분류", () => {
  // 간식은 단순 대문자·소문자 변환이 아니다. 화면은 snack, 추천 API는 treat다
  it("요청은 간식을 treat로 바꾸고 전체는 보내지 않는다", () => {
    expect(toApiCategory("snack")).toBe("treat");
    expect(toApiCategory("food")).toBe("food");
    expect(toApiCategory("supplement")).toBe("supplement");
    expect(toApiCategory(undefined)).toBeUndefined();
  });

  it("응답의 대문자 분류를 화면 값으로 풀고 TREAT는 snack이다", () => {
    expect(toCategory("FOOD")).toBe("food");
    expect(toCategory("TREAT")).toBe("snack");
    expect(toCategory("supplement")).toBe("supplement");
  });

  it("모르는 분류는 버리지 않고 받은 그대로 둔다", () => {
    expect(toCategory("TOY")).toBe("TOY");
  });
});

describe("점수", () => {
  it("0~100 정수는 그대로 쓴다", () => {
    expect(toMatchScore(57)).toBe(57);
    expect(toMatchScore(0)).toBe(0);
    expect(toMatchScore(100)).toBe(100);
  });

  it("0~1 소수가 오면 예전 방식으로 보고 100을 곱해 반올림한다", () => {
    expect(toMatchScore(0.574)).toBe(57);
    expect(toMatchScore(0.578)).toBe(58);
  });

  // 1을 100점으로 올리면 거의 안 맞는 상품이 가장 잘 맞는 상품이 된다
  it("정수 1은 1점이다", () => {
    expect(toMatchScore(1)).toBe(1);
  });

  it("소수점이 붙은 0~100 값은 반올림하고, 범위를 넘으면 0~100에 가둔다", () => {
    expect(toMatchScore(57.6)).toBe(58);
    expect(toMatchScore(130)).toBe(100);
    expect(toMatchScore(-4)).toBe(0);
  });

  // 0으로 내리면 "확인이 필요해요"로 읽혀 궁합이 나쁜 상품처럼 보인다(entities/product README)
  it("값이 없으면 0점이 아니라 null이다", () => {
    expect(toMatchScore(null)).toBeNull();
    expect(toMatchScore(undefined)).toBeNull();
    expect(toMatchScore(Number.NaN)).toBeNull();
  });
});

describe("판매 상태", () => {
  it("대소문자와 구분자를 가리지 않고 품절·타임딜을 가른다", () => {
    expect(toSaleStatus("ON_SALE")).toBe("onSale");
    expect(toSaleStatus("SOLD_OUT")).toBe("soldOut");
    expect(toSaleStatus("sold-out")).toBe("soldOut");
    expect(toSaleStatus("OUT_OF_STOCK")).toBe("soldOut");
    expect(toSaleStatus("time_deal")).toBe("timeDeal");
    expect(toSaleStatus("DEAL")).toBe("timeDeal");
  });

  it("모르는 값은 판매 중으로 본다", () => {
    expect(toSaleStatus("DISCONTINUED")).toBe("onSale");
    expect(toSaleStatus("")).toBe("onSale");
  });
});

describe("단가", () => {
  it("양을 떼고 단위만 소문자로 쓴다", () => {
    expect(toUnitPrice("1000G", 19.0)).toEqual({ label: "g", price: 19 });
    expect(toUnitPrice("500ML", 12.4)).toEqual({ label: "ml", price: 12 });
    expect(toUnitPrice("30개", 680)).toEqual({ label: "개", price: 680 });
    expect(toUnitPrice("G", 11)).toEqual({ label: "g", price: 11 });
  });

  // 추천 서버는 상품 DB의 표준 단위(G·ML·EA)를 그대로 붙인다. 소문자로만 바꾸면 "1ea당"이 됐다
  it("개수 단위 EA는 '개'로 쓴다", () => {
    expect(toUnitPrice("30EA", 800)).toEqual({ label: "개", price: 800 });
    expect(toUnitPrice("1ea", 800)).toEqual({ label: "개", price: 800 });
  });

  it("단위를 읽을 수 없거나 반올림한 가격이 1원 미만이면 없다", () => {
    expect(toUnitPrice("", 19)).toBeNull();
    expect(toUnitPrice("1000", 19)).toBeNull();
    expect(toUnitPrice("1000G/개", 19)).toBeNull();
    expect(toUnitPrice("1000G", 0)).toBeNull();
    expect(toUnitPrice("1000G", 0.4)).toBeNull();
    expect(toUnitPrice("1000G", Number.NaN)).toBeNull();
  });

  // 메인 맞춤 상품 시안(1758-68917)의 "1개당 800원" 꼴이다. 타임딜 카드의 "약"은 붙지 않는다
  it("단가 줄은 시안처럼 '1g당 19원'이고 천 단위에 쉼표를 둔다", () => {
    expect(formatUnitPriceLine({ label: "g", price: 19 })).toBe("1g당 19원");
    expect(formatUnitPriceLine({ label: "개", price: 1050 })).toBe("1개당 1,050원");
  });
});

describe("toRecommendation", () => {
  it("명세 모양의 항목을 화면 값으로 옮긴다", () => {
    expect(toRecommendation(ITEM)).toEqual({
      productId: 219,
      rank: 1,
      score: 57,
      reason: ITEM.reason_text,
      allergyPenalized: false,
      name: "한입 크림 파우치 연어살 20포",
      thumbnailUrl: "https://cdn.example/219.jpg",
      category: "snack",
      price: 19000,
      originalPrice: 20000,
      unitPrice: { label: "g", price: 19 },
      rating: 3.96,
      reviewCount: 665,
      status: "onSale",
      createdAt: "2026-09-14T01:58:19+00:00",
    });
  });

  // 감점 상품은 목록에서 빠지지 않는다. 성분 코드는 화면에 넘기지 않는다
  it("알레르기 감점 상품을 표시하고 성분 코드는 넘기지 않는다", () => {
    const penalized = toRecommendation({
      ...ITEM,
      allergy_status: "PENALIZED",
      matched_allergen: ["CHICKEN"],
    });

    expect(penalized.allergyPenalized).toBe(true);
    expect(JSON.stringify(penalized)).not.toContain("CHICKEN");
    expect(toRecommendation({ ...ITEM, allergy_status: "PENDING" }).allergyPenalized).toBe(false);
  });

  it("점수가 빠진 항목은 null이다", () => {
    const withoutScore: RecommendationItemResponse = { ...ITEM };
    delete withoutScore.score;
    expect(toRecommendation(withoutScore).score).toBeNull();
  });
});
