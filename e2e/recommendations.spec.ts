// 맞춤 추천의 헤더·아이 이름과, 추천 API 결과를 분류·정렬로 보는 흐름을 실제 브라우저로 본다.
// QA 1차 피드백(#470)에서 잡힌 것이다 — 헤더에 알림·장바구니가 없었고, 아이 이름이 예시(코코·봄이)라
// 마이페이지의 실제 이름과 달랐다. 상품은 추천 API(`POST /api/v1/recommend/home`) 결과다(#600).
import { expect, test, type Page } from "@playwright/test";

import { stubCart } from "./fixtures/cart";
import { stubNotifications } from "./fixtures/notifications";
import { stubPetCatalog } from "./fixtures/pet-catalog";
import { RECOMMENDED_ITEMS, stubRecommendations } from "./fixtures/recommendations";
import { signIn } from "./fixtures/session";

test.beforeEach(async ({ page }) => {
  // 아이 목록은 로그인했을 때만 부른다
  await signIn(page);
  await stubPetCatalog(page);
  await stubNotifications(page);
  await stubCart(page);
});

/** 격자에 놓인 상품 이름을 위에서부터 */
function productNames(page: Page) {
  return page.getByRole("main").locator("a[href^='/products/'] p.truncate").allTextContents();
}

test("헤더에 알림과 장바구니가 있다", async ({ page }) => {
  await stubRecommendations(page);
  await page.goto("/recommendations");

  await expect(page.getByRole("link", { name: "알림" })).toHaveAttribute(
    "href",
    "/mypage/notifications",
  );
  await expect(page.getByRole("link", { name: "장바구니에 3개" })).toHaveAttribute("href", "/cart");
});

test("아이는 실제 목록에서 기본 아이부터 고르고, 바꾸면 적합도 문장도 따라간다", async ({
  page,
}) => {
  const recommendations = await stubRecommendations(page);
  await page.goto("/recommendations");

  // 스텁의 기본 아이는 코코다
  const picker = page.getByRole("combobox", { name: "어느 아이의 추천을 볼지" });
  await expect(picker).toContainText("코코");
  await expect(page.getByText(/코코와 적합도 \d+점/).first()).toBeAttached();
  await expect.poll(() => recommendations.sent[0]).toEqual({ pet_id: 3, size: 50 });

  await picker.click();
  await page.getByRole("option", { name: "보리" }).click();

  await expect(page).toHaveURL(/pet=7/);
  await expect(page.getByText(/보리와 적합도 \d+점/).first()).toBeAttached();
  await expect.poll(() => recommendations.sent.at(-1)).toEqual({ pet_id: 7, size: 50 });
});

// 분류는 서버가 거른다. 간식은 요청에서 treat다
test("분류를 바꾸면 그 분류로 다시 부르고 서버가 준 목록을 그린다", async ({ page }) => {
  const recommendations = await stubRecommendations(page);
  await page.goto("/recommendations");
  await expect(page.getByText("한입 크림 파우치 연어살 20포")).toBeVisible();

  await page
    .getByRole("navigation", { name: "상품 분류" })
    .getByRole("button", { name: "영양제", exact: true })
    .click();

  await expect
    .poll(() => recommendations.sent.at(-1))
    .toEqual({
      pet_id: 3,
      category: "supplement",
      size: 50,
    });
  await expect.poll(() => productNames(page)).toEqual(["관절 튼튼 영양제 60정"]);

  await page
    .getByRole("navigation", { name: "상품 분류" })
    .getByRole("button", { name: "간식", exact: true })
    .click();
  await expect.poll(() => recommendations.sent.at(-1)?.category).toBe("treat");
});

// 서버가 추천순만 지원해 나머지는 받은 목록 안에서 늘어놓는다(entities/recommendation README)
test("정렬을 바꾸면 받은 목록을 그 기준으로 다시 늘어놓는다", async ({ page }) => {
  const recommendations = await stubRecommendations(page);
  await page.goto("/recommendations");

  await expect
    .poll(() => productNames(page))
    .toEqual([
      "한입 크림 파우치 연어살 20포",
      "닭고기 동결건조 트릿",
      "그레인프리 연어 사료 2kg",
      "관절 튼튼 영양제 60정",
    ]);

  await page.getByRole("combobox", { name: "정렬" }).click();
  await page.getByRole("option", { name: "최신순" }).click();
  await expect(page).toHaveURL(/sort=latest/);
  await expect
    .poll(() => productNames(page))
    .toEqual([
      "그레인프리 연어 사료 2kg",
      "관절 튼튼 영양제 60정",
      "한입 크림 파우치 연어살 20포",
      "닭고기 동결건조 트릿",
    ]);

  await page.getByRole("combobox", { name: "정렬" }).click();
  await page.getByRole("option", { name: "별점 높은순" }).click();
  await expect
    .poll(() => productNames(page))
    .toEqual([
      "닭고기 동결건조 트릿",
      "그레인프리 연어 사료 2kg",
      "관절 튼튼 영양제 60정",
      "한입 크림 파우치 연어살 20포",
    ]);

  // 정렬은 서버에 다시 묻지 않는다
  expect(recommendations.sent).toHaveLength(1);
});

// 목데이터의 짧은 이름에서는 드러나지 않았다. 실제 추천 상품명은 칸보다 길 수 있다
test("긴 상품명은 칸 안에서 말줄임되고 카드가 칸 폭을 넘지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await stubRecommendations(page, {
    items: [
      {
        ...RECOMMENDED_ITEMS[0],
        product_name: "저알러지 가수분해 양고기 사료 1.2kg 대용량 두 봉 묶음",
      },
      RECOMMENDED_ITEMS[1],
    ],
  });
  await page.goto("/recommendations");

  const cell = page.getByRole("listitem").filter({ hasText: "저알러지 가수분해 양고기" });
  await expect(cell).toBeVisible();
  const cellBox = await cell.boundingBox();
  const cardBox = await cell.getByRole("link").boundingBox();
  expect(cardBox!.width, "카드가 칸보다 넓다").toBeLessThanOrEqual(cellBox!.width + 0.5);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
});

test("알레르기 감점 상품은 목록에 남고 주의 한 줄이 붙는다", async ({ page }) => {
  await stubRecommendations(page);
  await page.goto("/recommendations");

  const card = page.getByRole("listitem").filter({ hasText: "닭고기 동결건조 트릿" });
  await expect(card).toContainText("등록한 알레르기 성분이 들어 있어요");
  await expect(card).not.toContainText("CHICKEN");
});

test("추천이 실패하면 격자만 알리고 분류·정렬은 남는다", async ({ page }) => {
  await stubRecommendations(page, { failWith: 404 });
  await page.goto("/recommendations");

  await expect(page.getByText("맞춤 상품을 불러오지 못했어요. 다시 시도해 주세요.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "상품 분류" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "정렬" })).toBeVisible();
});
