// 검색: 바로 칠 수 있는지, 추천어가 자리를 넘겨받는지, 기록을 지울 수 있는지 본다.
import { expect, test } from "@playwright/test";

test("들어오면 바로 칠 수 있고 글자를 넣으면 추천어가 나온다", async ({ page }) => {
  await page.goto("/search");

  // 검색하러 온 화면이라 한 번 더 누르게 하지 않는다
  await expect(page.getByLabel("상품 검색")).toBeFocused();

  await page.getByLabel("상품 검색").fill("중소형");

  const suggestions = page.getByRole("list", { name: "추천 검색어" });
  await expect(suggestions.getByRole("listitem")).toHaveCount(3);
  // 최근 검색어는 자리를 내준다
  await expect(page.getByText("최근 검색어")).toBeHidden();
});

test("최근 검색어를 지우면 비었다고 알린다", async ({ page }) => {
  await page.goto("/search");

  await page.getByLabel("양치 껌 검색 기록 지우기").click();
  await expect(page.getByRole("button", { name: "양치 껌" })).toBeHidden();

  await page.getByRole("button", { name: "전체삭제" }).click();
  await expect(page.getByText("최근에 검색한 내역이 없어요")).toBeVisible();
});

test("카테고리를 고르면 그 종류 목록으로 간다", async ({ page }) => {
  await page.goto("/search");

  await page.getByRole("link", { name: "간식" }).click();
  await expect(page).toHaveURL(/category=snack/);
});
