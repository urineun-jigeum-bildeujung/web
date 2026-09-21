// 서버 컴포넌트가 직접 부르는 API를 흉내 내는 아주 작은 목 서버.
//
// 브라우저 레벨 page.route()는 Next 서버 프로세스가 보내는 요청을 못 가로챈다
// (별개의 Node 프로세스라서). 그래서 이 서버를 따로 띄우고 API_BASE_URL_INTERNAL이
// 이쪽을 가리키게 해서, 서버 fetch()가 실제로 이 서버에 닿게 만든다(#282).
//
// **검색 알고리즘을 복제하지 않는다.** 쿼리(keyword·sort)별로 미리 정해 둔 고정
// 응답만 돌려준다 — 진짜 필터·정렬 로직은 백엔드 몫이고, 여기선 화면과 흐름만 본다.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);

/** e2e 테스트가 이름·id로 확인하는 상품들. 옛 목데이터 이름·가격을 그대로 옮겼다 */
const PUPPY_FOOD = {
  productId: 4,
  productName: "퍼피 성장기 사료 1kg",
  price: 21000,
  discountRate: 0,
  unitPrice: 1060,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.6,
  reviewCount: 109,
};

const SENIOR_FOOD = {
  productId: 2,
  productName: "노령견 저지방 소화케어 사료 1kg",
  price: 27200,
  discountRate: 0,
  unitPrice: 1050,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.5,
  reviewCount: 108,
};

const ALLERGY_FOOD = {
  productId: 3,
  productName: "알레르기 케어 무곡물 사료 1kg",
  price: 26100,
  discountRate: 0,
  unitPrice: 1060,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.8,
  reviewCount: 508,
};

const SMALL_BREED_FOOD = {
  productId: 1,
  productName: "중소형견 소포장 사료 1kg",
  price: 31500,
  discountRate: 0,
  unitPrice: 1050,
  unitLabel: "하루 예상 급여비 약",
  thumbnailUrl: null,
  avgRating: 4.8,
  reviewCount: 108,
};

const FOOD_DEFAULT = [SMALL_BREED_FOOD, SENIOR_FOOD, ALLERGY_FOOD, PUPPY_FOOD];
const FOOD_PRICE_ASC = [PUPPY_FOOD, ALLERGY_FOOD, SENIOR_FOOD, SMALL_BREED_FOOD];
const FOOD_PRICE_DESC = [SMALL_BREED_FOOD, SENIOR_FOOD, ALLERGY_FOOD, PUPPY_FOOD];

/** keyword(+sort) 조합별 고정 응답. 없는 조합은 기본으로 빈 결과를 준다 */
function resolveItems(keyword, sort) {
  if (keyword === "사료") {
    if (sort === "PRICE_ASC") return FOOD_PRICE_ASC;
    if (sort === "PRICE_DESC") return FOOD_PRICE_DESC;
    return FOOD_DEFAULT;
  }
  if (keyword === "퍼피") return [PUPPY_FOOD];
  if (keyword === "무곡물") return [ALLERGY_FOOD];
  return [];
}

function searchProducts(url) {
  const keyword = url.searchParams.get("keyword") ?? "";
  const sort = url.searchParams.get("sort");
  const items = resolveItems(keyword, sort);
  return { items, nextCursor: null, hasNext: false, totalCount: items.length };
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === "/health") {
    res.writeHead(200).end("ok");
    return;
  }

  if (url.pathname === "/api/v1/products/search") {
    const body = JSON.stringify(searchProducts(url));
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  res
    .writeHead(404, { "content-type": "application/json" })
    .end(
      JSON.stringify({ title: "Not Found", status: 404, detail: `no mock for ${url.pathname}` }),
    );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-api-server] listening on http://127.0.0.1:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
