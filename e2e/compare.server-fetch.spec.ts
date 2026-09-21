// 상품 비교: 자리를 검색으로 채우는 길이 이어지는지 본다.
//
// 검색을 거치므로(#282) `playwright.server-fetch.config.ts`의 목 API 서버·전용 Next
// 서버가 필요하다. 나머지 비교 화면 테스트(`e2e/compare.spec.ts`)는 검색을 거치지
// 않아 기본 스위트에 그대로 남아 있다.
import { expect, test } from "@playwright/test";

// 고르기 화면(comp_011)이 시안에서 빠지고 검색으로 통일됐다(#144).
// 비교 → 검색 → 결과 → 비교로 돌아오는 한 바퀴가 이어져야 자리를 채울 수 있다.
test("빈 자리를 검색에서 골라 채운다", async ({ page }) => {
  await page.goto("/compare");

  // 한 자리를 비워 담을 곳을 만든다. 남은 자리(2번)는 검색을 다녀오는 동안
  // other 파라미터로 들고 다녀야 되돌아왔을 때 사라지지 않는다(#245)
  await page
    .getByRole("button", { name: /비교에서 빼기/ })
    .first()
    .click();
  await page.getByRole("button", { name: "상품 추가하기" }).click();

  await expect(page).toHaveURL(/\/search\?slot=0&other=2$/);
  await expect(page.getByRole("heading", { name: "최근 검색어" })).toBeVisible();

  await page.getByLabel("상품 검색").fill("퍼피");
  await page.getByLabel("상품 검색").press("Enter");

  await expect(page).toHaveURL(/\/search\/result/);
  // 고르기 화면은 카드가 링크가 아니라 체크 버튼이다 — 눌러 체크하고 선택 완료로 확정한다
  await page.getByRole("button", { name: /퍼피 성장기 사료/ }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  await expect(page).toHaveURL(/\/compare\?slot=0&product=4&other=2$/);
  // 이름은 카드·표 머리·표 설명 세 곳에 나온다. 자리에 담겼는지는 그 자리의 빼기 버튼으로 본다
  await expect(
    page.getByRole("button", { name: "퍼피 성장기 사료 1kg 비교에서 빼기" }),
  ).toBeVisible();
});
