// 검색 결과: 검색에서 넘어오는 길과 되돌아가는 길, 정렬이 뒤로가기를 막지 않는지 본다.
//
// 검색·정렬은 서버(product-service)가 한다(#282). Next 서버 프로세스가 보내는 요청은
// 브라우저 page.route()로 못 가로채, `playwright.server-fetch.config.ts`가 이 스펙 전용
// 목 API 서버(`mock-api-server.mjs`)와 전용 포트의 Next 서버를 따로 띄운다.
import { expect, test } from "@playwright/test";

import { signIn } from "./fixtures/session";
import { stubWishlist } from "./fixtures/wishlist";

test("검색어를 넣고 엔터를 치면 결과 화면으로 간다", async ({ page }) => {
  await page.goto("/search");

  await page.getByLabel("상품 검색").fill("사료");
  await page.getByLabel("상품 검색").press("Enter");

  await expect(page).toHaveURL(/\/search\/result\?q=/);
  await expect(page.getByRole("heading", { name: "검색 결과" })).toBeVisible();
});

test("검색바를 누르면 검색 화면으로 되돌아간다", async ({ page }) => {
  await page.goto("/search/result?q=사료");

  // 입력창처럼 보이지만 버튼이다. 여기서 고쳐 치는 게 아니라 검색 화면으로 간다
  await page.getByRole("button", { name: /검색어 고치기/ }).click();

  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByLabel("상품 검색")).toBeFocused();
});

test("걸리는 상품이 없으면 없다고 알리고 정렬을 감춘다", async ({ page }) => {
  await page.goto("/search/result?q=고양이모래");

  await expect(page.getByText("검색 결과가 없어요")).toBeVisible();
  // 셀 것이 없는데 고를 수 있는 것처럼 보이면 안 된다
  await expect(page.getByLabel("정렬")).toHaveCount(0);
});

// 정렬은 같은 목록을 좁히는 것이라 히스토리에 쌓지 않는다.
// 쌓이면 뒤로가기를 여러 번 눌러야 검색 화면으로 돌아간다.
test("정렬을 바꿔도 뒤로가기 한 번에 검색 화면으로 간다", async ({ page }) => {
  await page.goto("/search");
  await page.getByLabel("상품 검색").fill("사료");
  await page.getByLabel("상품 검색").press("Enter");

  await page.getByLabel("정렬").click();
  await page.getByRole("option", { name: "낮은 가격순" }).click();
  await expect(page).toHaveURL(/sort=price-low/);

  await page.goBack();
  await expect(page).toHaveURL(/\/search$/);
});

// 정렬을 골라도 순서가 그대로면 죽은 UI다. 서버가 정렬해 준 결과를 그대로 그리는지 본다
test("정렬을 고르면 목록 순서가 바뀐다", async ({ page }) => {
  await page.goto("/search/result?q=사료");

  const names = () => page.getByRole("listitem").locator("p").first();

  await page.getByLabel("정렬").click();
  await page.getByRole("option", { name: "낮은 가격순" }).click();
  await expect(names()).toHaveText("퍼피 성장기 사료 1kg");

  await page.getByLabel("정렬").click();
  await page.getByRole("option", { name: "높은 가격순" }).click();
  await expect(names()).toHaveText("중소형견 소포장 사료 1kg");
});

// 검색하면 결과 화면으로 떠나므로, 돌아왔을 때 방금 검색한 말이 없으면
// 최근 검색어가 사실상 동작하지 않는다.
test("검색한 말이 돌아와도 최근 검색어에 남는다", async ({ page }) => {
  await page.goto("/search");

  await page.getByLabel("상품 검색").fill("무곡물");
  await page.getByLabel("상품 검색").press("Enter");
  await expect(page).toHaveURL(/\/search\/result/);

  await page.getByRole("button", { name: /검색어 고치기/ }).click();

  const recent = page.getByRole("button", { name: "무곡물", exact: true });
  await expect(recent).toBeVisible();
  // 맨 앞으로 올라온다
  await expect(page.getByRole("listitem").first()).toContainText("무곡물");
});

// 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도 뜨지 않았다 (#483)
test("로그인했으면 찜한 상품의 하트가 채워져 있고 누르면 서버에서 뒤집는다", async ({ page }) => {
  await signIn(page);
  const wishlist = await stubWishlist(page, { wished: [4] });
  await page.goto("/search/result?q=사료");

  // 찜 목록은 하이드레이션 뒤에 받는다. 채워진 하트가 보이면 누를 수 있다
  await expect(page.getByRole("button", { name: "퍼피 성장기 사료 1kg 찜하기" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const senior = page.getByRole("button", { name: "노령견 저지방 소화케어 사료 1kg 찜하기" });
  // 화면은 낙관적으로 먼저 바뀐다. 요청이 끝난 뒤에 기록을 보고 새로고침해야 흔들리지 않는다
  const patched = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" && response.url().endsWith("/members/me/wishlist/2"),
  );
  await senior.click();
  await patched;
  await expect(senior).toHaveAttribute("aria-pressed", "true");
  expect(wishlist.toggled).toEqual([2]);
});

// 첫 20개만 그리던 동안 "총 200개" 아래 카드가 20개에서 끝났다(QA SR-014, #532).
// 목 서버는 `1kg`을 두 개씩 두 쪽으로 나눠 주고, 다음 쪽에선 서버처럼 개수를 null로 준다
test("목록 끝까지 내리면 다음 쪽을 이어 받아 총 개수만큼 카드가 보인다", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/search/result?q=1kg");

  await expect(page.getByText("총 4개")).toBeVisible();
  const cards = page.getByRole("main").getByRole("link");
  await cards.last().scrollIntoViewIfNeeded();

  await expect(cards).toHaveCount(4);
  await expect(page.getByRole("link", { name: /퍼피 성장기 사료 1kg/ })).toBeVisible();
  // 더 받아도 개수는 첫 쪽이 센 값 그대로다
  await expect(page.getByText("총 4개")).toBeVisible();
});

// 검색바 버튼에 min-w-0이 없어 안쪽 truncate가 먹지 않았다. 띄어쓰기 없는 200자 검색어에
// 문서 폭이 1618px까지 늘어 화면 전체가 옆으로 밀렸다(#532). jsdom은 폭을 재지 못해 여기서 본다
test("띄어쓰기 없는 긴 검색어도 검색바 안에서 잘리고 화면이 옆으로 넘치지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  const keyword = "a".repeat(200);
  await page.goto(`/search/result?q=${keyword}`);

  const searchBar = page.getByRole("button", { name: /검색어 고치기/ });
  const keywordText = searchBar.getByText(keyword, { exact: true });
  await expect(keywordText).toBeVisible();

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);

  // 검색바는 화면 안에 들고, 검색어는 그 안에서 한 줄로 잘린다(말줄임)
  const bar = await searchBar.evaluate((element) => element.getBoundingClientRect().right);
  expect(bar).toBeLessThanOrEqual(layout.viewportWidth);
  const clipped = await keywordText.evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  );
  expect(clipped).toBe(true);
});

/*
 * 서버가 준 정가와 할인율을 카드가 그리는지 본다(#458). 그동안 목 서버 픽스처에
 * `originalPrice` 키가 없고 `discountRate`가 모두 0이라 이 경로를 한 번도 지나지 않았다(#632).
 *
 * **할인율은 서버 값을 써야 한다.** 노령견 사료는 `6,700 / 33,900 = 19.76%`라 서버는 `HALF_UP`으로
 * 20, 화면의 `calcDiscountRate`는 버림으로 19다. 20이 보이면 서버 값을 쓰는 것이고, 19가 보이면
 * 화면이 두 금액으로 다시 계산한 것이다 — 단위 테스트가 보는 그 구분을 실제 응답 경로에서 본다.
 */
test("할인 중인 카드만 서버 할인율과 정가 취소선을 보인다", async ({ page }) => {
  await page.goto("/search/result?q=사료");

  const senior = page.getByRole("listitem").filter({ hasText: "노령견 저지방 소화케어 사료 1kg" });
  await expect(senior).toBeVisible();

  await expect(senior.getByText("20%")).toBeVisible();
  await expect(senior.getByText("27,200원")).toBeVisible();
  // 버림으로 다시 계산했으면 19%가 보인다
  await expect(senior.getByText("19%")).toBeHidden();

  /**
   * 정가에 실제로 취소선이 그려졌는가.
   *
   * **클래스 이름이 아니라 계산된 스타일을 본다.** `.line-through`로 집으면 클래스를 바꾸기만
   * 해도 테스트가 깨지고, 반대로 클래스가 남은 채 스타일이 덮어써지면 취소선이 사라졌는데도
   * 통과한다. 카드는 상품명으로 집는다 (PR #633 리뷰 지적, `.coderabbit.yaml`의 경로 지침)
   */
  const struckThrough = (card: ReturnType<typeof page.getByRole>, text: string) =>
    card
      .getByText(text)
      .evaluate((element) => getComputedStyle(element).textDecorationLine.includes("line-through"));

  await expect.poll(() => struckThrough(senior, "33,900원")).toBe(true);

  // 할인하지 않는 상품은 정가가 판매가와 같이 와, 카드가 정가 줄을 아예 그리지 않는다
  const puppy = page.getByRole("listitem").filter({ hasText: "퍼피 성장기 사료 1kg" });
  await expect(puppy.getByText("21,000원")).toBeVisible();
  await expect(puppy.getByText("%", { exact: false })).toBeHidden();
  await expect.poll(() => struckThrough(puppy, "21,000원")).toBe(false);
});
