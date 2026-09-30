// 추천 요청이 무엇을 보내고, 응답을 어떤 순서·모양으로 돌려주는지 본다(#600).
import { afterEach, expect, test, vi } from "vitest";

import { getHomeRecommendations } from "./recommendations";

const RESPONSE = {
  pet_id: 3,
  pet_name: "말티즈",
  generated_at: "2026-09-30T07:28:46+00:00",
  items: [
    {
      product_id: 219,
      rank: 1,
      score: 57,
      reason_text: "기호성 평가가 좋아 추천합니다.",
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
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(RESPONSE));
  vi.stubGlobal("fetch", fetchMock);
  return () => {
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    return { url, method: init.method, body: JSON.parse(String(init.body)) as unknown };
  };
}

test("추천 API에 아이·분류·개수를 snake_case로 POST한다. 간식은 treat다", async () => {
  const sent = stubFetch();

  await getHomeRecommendations({ petId: 3, category: "snack", size: 50 });

  const { url, method, body } = sent();
  expect(url).toMatch(/\/api\/v1\/recommend\/home$/);
  expect(method).toBe("POST");
  expect(body).toEqual({ pet_id: 3, category: "treat", size: 50 });
});

test("전체와 기본 개수는 보내지 않는다", async () => {
  const sent = stubFetch();

  await getHomeRecommendations({ petId: 3 });

  expect(sent().body).toEqual({ pet_id: 3 });
});

test("응답 항목을 화면 모양으로 옮긴다. 아이 이름(pet_name)은 쓰지 않는다", async () => {
  stubFetch();

  const [first] = await getHomeRecommendations({ petId: 3 });

  expect(first).toMatchObject({ productId: 219, name: "한입 크림 파우치 연어살 20포" });
  expect(first).not.toHaveProperty("petName");
});
