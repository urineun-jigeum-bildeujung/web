// 검색 결과: 검색에서 넘어오는 길과 되돌아가는 길, 정렬이 뒤로가기를 막지 않는지 본다.
import { expect, test } from "@playwright/test";

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

// 정렬을 골라도 순서가 그대로면 죽은 UI다.
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
