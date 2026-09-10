// 상품 비교: 자리를 검색으로 채우는 길이 이어지는지, 종류가 다르면 표를 감추는지 본다.
import { expect, test } from "@playwright/test";

// 고르기 화면(comp_011)이 시안에서 빠지고 검색으로 통일됐다(#144).
// 비교 → 검색 → 결과 → 비교로 돌아오는 한 바퀴가 이어져야 자리를 채울 수 있다.
test("빈 자리를 검색에서 골라 채운다", async ({ page }) => {
  await page.goto("/compare");

  // 한 자리를 비워 담을 곳을 만든다
  await page
    .getByRole("button", { name: /비교에서 빼기/ })
    .first()
    .click();
  await page.getByRole("button", { name: "상품 추가하기" }).click();

  await expect(page).toHaveURL(/\/search\?slot=0$/);
  await expect(page.getByText("비교할 상품을 검색해 주세요")).toBeVisible();

  await page.getByLabel("상품 검색").fill("퍼피");
  await page.getByLabel("상품 검색").press("Enter");

  await expect(page.getByText("고르면 비교 화면으로 담아 드릴게요")).toBeVisible();
  await page.getByRole("link", { name: /퍼피 성장기 사료/ }).click();

  await expect(page).toHaveURL(/\/compare\?slot=0&product=4$/);
  // 이름은 카드·표 머리·표 설명 세 곳에 나온다. 자리에 담겼는지는 그 자리의 빼기 버튼으로 본다
  await expect(
    page.getByRole("button", { name: "퍼피 성장기 사료 1kg 비교에서 빼기" }),
  ).toBeVisible();
});

// 시안 comp_001_에러. 사료와 간식은 기준이 달라 나란히 놓으면 착시가 생긴다.
test("종류가 다른 둘을 담으면 표 대신 안내가 나온다", async ({ page }) => {
  await page.goto("/compare?slot=1&product=5");

  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.getByText(/건식은 건식끼리/)).toBeVisible();
});

test("같은 종류끼리는 표가 그대로 보인다", async ({ page }) => {
  await page.goto("/compare?slot=1&product=3");

  await expect(page.getByRole("table")).toBeVisible();
});
