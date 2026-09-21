// 상품 비교: 종류가 다르면 표를 감추는지 본다.
//
// "빈 자리를 검색에서 골라 채운다"는 /search/result를 거쳐 서버 검색 API를 타서
// `e2e/server-fetch/compare.spec.ts`로 옮겼다(#282) — 이 파일의 나머지 테스트는
// /compare에 직접 진입해 검색을 거치지 않는다.
import { expect, test } from "@playwright/test";

// 시안 comp_001_에러. 사료와 간식은 기준이 달라 나란히 놓으면 착시가 생긴다.
// other=1을 명시해야 반대쪽 자리가 채워진다 — 없으면 그 자리는 비워 둔다(#245)
test("종류가 다른 둘을 담으면 표 대신 안내가 나온다", async ({ page }) => {
  await page.goto("/compare?slot=1&product=5&other=1");

  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.getByText(/건식은 건식끼리/)).toBeVisible();
});

// MOCK_ROWS는 정확히 1번·2번 조합의 실제 값이다. 이 조합일 때만 항목별 표를 보인다
test("실제 값이 있는 조합은 표가 그대로 보인다", async ({ page }) => {
  await page.goto("/compare?slot=1&product=2&other=1");

  await expect(page.getByRole("table")).toBeVisible();
});

// food는 1·2번 말고도 여러 상품이 있다. 같은 종류라도 값이 없는 조합엔 1·2번 값을
// 그대로 붙이는 대신 준비 중이라고 알린다(#245 후속)
test("같은 종류라도 실제 값이 없는 조합은 표 대신 준비 중 안내가 나온다", async ({ page }) => {
  await page.goto("/compare?slot=1&product=3&other=1");

  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.getByText(/아직 준비 중/)).toBeVisible();
});
