// 상품 비교: 자리를 검색으로 채우는 길이 이어지는지, 종류가 다르면 표를 감추는지 본다.
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
