// AI 추천(`POST /api/v1/recommend/home`)을 세운다. 명세 v3.0.0(2026-09-30) 모양 그대로 돌려준다 (#600).
//
// **분류는 서버가 거르는 것처럼 흉내 낸다.** 요청의 `category`로 걸러 돌려줘야 탭을 바꿨을 때
// 화면이 받은 목록을 다시 거르지 않고 서버 응답을 그대로 그리는지 볼 수 있다. 무엇을 보내는지
// 모양은 단위 테스트(`entities/recommendation/api`)가 보므로 여기서는 화면 동작만 본다.

import type { Page } from "@playwright/test";

type Item = {
  product_id: number;
  rank: number;
  score: number | null;
  reason_text: string;
  allergy_status: string;
  matched_allergen: string[];
  product_name: string;
  thumbnail_url: string;
  category: string;
  price: number;
  original_price: number;
  unit_price: number;
  unit_label: string;
  rating: number;
  review_count: number;
  sales_count: number;
  status: string;
  created_at: string;
};

function item(fields: Partial<Item> & Pick<Item, "product_id" | "rank" | "product_name">): Item {
  return {
    score: 80,
    reason_text:
      "나와 비슷한 반려동물을 키우는 분들이 남긴 피부·모질, 소화·배변, 기호성 평가가 좋아 추천합니다.",
    allergy_status: "SAFE",
    matched_allergen: [],
    thumbnail_url: "/images/e2e/product-photo-1.png",
    category: "FOOD",
    price: 19000,
    original_price: 20000,
    unit_price: 19.0,
    unit_label: "1000G",
    rating: 4.2,
    review_count: 120,
    sales_count: 1000,
    status: "ON_SALE",
    created_at: "2026-09-14T01:58:19+00:00",
    ...fields,
  };
}

/**
 * 추천 순서(rank), 최신순(created_at), 별점순(rating)이 서로 다른 순서를 내도록 섞었다.
 * 둘째는 아이의 알레르기 성분과 겹쳐 감점된 상품이고, 셋째는 품절이다
 */
export const RECOMMENDED_ITEMS: Item[] = [
  item({
    product_id: 219,
    rank: 1,
    score: 57,
    product_name: "한입 크림 파우치 연어살 20포",
    category: "TREAT",
    rating: 3.96,
    review_count: 665,
    created_at: "2026-09-14T01:58:19+00:00",
  }),
  item({
    product_id: 301,
    rank: 2,
    score: 0.88,
    product_name: "닭고기 동결건조 트릿",
    category: "TREAT",
    allergy_status: "PENALIZED",
    matched_allergen: ["CHICKEN"],
    thumbnail_url: "/images/e2e/product-photo-2.png",
    rating: 4.8,
    created_at: "2026-09-01T00:00:00+00:00",
  }),
  item({
    product_id: 102,
    rank: 3,
    score: 91,
    product_name: "그레인프리 연어 사료 2kg",
    status: "SOLD_OUT",
    price: 31200,
    original_price: 39000,
    unit_price: 15.6,
    unit_label: "2000G",
    rating: 4.5,
    created_at: "2026-09-25T00:00:00+00:00",
  }),
  item({
    product_id: 405,
    rank: 4,
    score: null,
    product_name: "관절 튼튼 영양제 60정",
    category: "SUPPLEMENT",
    unit_price: 450,
    unit_label: "60개",
    rating: 4.0,
    created_at: "2026-09-20T00:00:00+00:00",
  }),
];

type StubOptions = {
  /** 이 상태 코드로 실패시킨다 */
  failWith?: number;
  /** 돌려줄 항목. 기본은 `RECOMMENDED_ITEMS` */
  items?: Item[];
};

export async function stubRecommendations(page: Page, { failWith, items }: StubOptions = {}) {
  /** 요청 본문. 어느 아이·분류·개수로 불렀는지 보는 테스트가 쓴다 */
  const sent: { pet_id: number; category?: string; size?: number }[] = [];

  await page.route("**/api/v1/recommend/home", (route) => {
    const body = route.request().postDataJSON() as (typeof sent)[number];
    sent.push(body);
    if (failWith) {
      return route.fulfill({
        status: failWith,
        json: { status: failWith, errorCode: `COMMON_${failWith}` },
      });
    }
    const all = items ?? RECOMMENDED_ITEMS;
    const category = body.category?.toUpperCase();
    const filtered = category ? all.filter((entry) => entry.category === category) : all;
    return route.fulfill({
      json: {
        pet_id: body.pet_id,
        pet_name: "말티즈",
        generated_at: "2026-09-30T07:28:46+00:00",
        items: filtered.slice(0, body.size ?? 9),
      },
    });
  });

  return { sent };
}
