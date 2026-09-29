// 상품 비교: 빈 칸으로 시작하는지, 자리를 상품 상세로 채우는지, 장바구니에 실제로 담는지 본다.
//
// "빈 자리를 검색에서 골라 채운다"는 /search/result를 거쳐 서버 검색 API를 타서
// `e2e/compare.server-fetch.spec.ts`로 옮겼다(#282) — 이 파일의 나머지 테스트는
// /compare에 직접 진입해 검색을 거치지 않는다. 자리의 상품 상세는 브라우저가 부르므로
// page.route로 세운다(#535).
import { expect, test, type Page } from "@playwright/test";

import { stubCart } from "./fixtures/cart";
import { signIn } from "./fixtures/session";

// 이 화면은 로그인해야 열린다. 세션이 없으면 로그인으로 보낸다(#542)
test.beforeEach(async ({ page }) => {
  await signIn(page);
});

/** 번호마다 이름·가격만 다른 상품 상세. 화면이 이 응답에서 이름을 가져오는지 보려고 목업과 다른 이름을 쓴다 */
function productDetail(productId: number, productName: string, price: number) {
  return {
    productId,
    timeDeal: null,
    summary: {
      images: [],
      productName,
      price,
      originalPrice: price,
      discountRate: 0,
      avgRating: null,
      reviewCount: 0,
      soldOut: false,
    },
    detailInfo: {
      manufacturer: null,
      brandName: null,
      originCountry: null,
      netQuantityValue: 1,
      netQuantityUnit: "kg",
      ingredients: [],
      feedingTarget: null,
      targetBreedSize: null,
      targetAgeGroup: null,
      targetSpecies: [],
      feedingMethod: null,
      allergens: [],
      cautions: [],
      consumptionPeriodDisplay: null,
      shelfLifeAfterOpeningDays: null,
      storageMethod: null,
    },
  };
}

const DETAILS: Record<string, ReturnType<typeof productDetail>> = {
  "1": productDetail(1, "비교 테스트 사료 1kg", 19000),
  "2": productDetail(2, "비교 테스트 사료 4kg", 50400),
};

async function stubProductDetails(page: Page) {
  await page.route("**/api/v1/products/*", (route) => {
    const id = new URL(route.request().url()).pathname.split("/").pop() ?? "";
    const body = DETAILS[id];
    return body ? route.fulfill({ json: body }) : route.fulfill({ status: 404, json: {} });
  });
}

// 담지 않았는데 예시 상품 둘이 담겨 있었다(QA HM-000)
test("고른 상품이 없으면 두 자리 모두 빈 칸으로 시작한다", async ({ page }) => {
  await page.goto("/compare");

  await expect(page.getByRole("button", { name: "상품 추가하기" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: /비교에서 빼기/ })).toHaveCount(0);
});

// 항목별 값을 주는 API가 없다. 목업 상품의 표를 실제 상품 이름 아래 붙이지 않고 준비 중이라고 알린다
test("두 자리가 차면 표 대신 준비 중 안내가 나온다", async ({ page }) => {
  await stubProductDetails(page);
  await page.goto("/compare?slot=1&product=2&other=1");

  await expect(
    page.getByRole("button", { name: "비교 테스트 사료 1kg 비교에서 빼기" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "비교 테스트 사료 4kg 비교에서 빼기" }),
  ).toBeVisible();
  await expect(page.getByText(/아직 준비 중/)).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});

// 예전엔 담지 않고 토스트만 띄웠다(QA CP-006·007·010)
test("장바구니 추가가 수량 시트를 열고 고른 상품을 실제로 담는다", async ({ page }) => {
  await stubCart(page);
  await stubProductDetails(page);
  await page.goto("/compare?slot=0&product=1&other=none");

  await page.getByRole("button", { name: "장바구니 추가" }).click();
  const request = page.waitForRequest(
    (req) => req.method() === "POST" && req.url().endsWith("/api/v1/carts/items"),
  );
  await page.getByRole("button", { name: "19,000원 장바구니 담기" }).click();

  expect((await request).postDataJSON()).toEqual({ itemType: "NORMAL", itemId: 1, quantity: 1 });
  await expect(page.getByText("장바구니에 담겼어요")).toBeVisible();
});
