// 홈 화면 E2E. 만들어 둔 화면으로 들어가는 입구가 뜨고 다크 모드 토글이 실제 브라우저에서 동작하는지 검증한다.
import { expect, test } from "@playwright/test";

test("홈 화면이 렌더링된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "골라주개냥" })).toBeVisible();
  await expect(page.getByText("소비량 예측형 스마트 구독 커머스")).toBeVisible();
});

test("만들어 둔 화면으로 들어가는 입구가 있다", async ({ page }) => {
  await page.goto("/");

  // 디자인 확정 전까지 이 화면이 각 화면의 임시 입구다
  for (const group of ["온보딩", "마이페이지"]) {
    await expect(page.getByRole("heading", { name: group })).toBeVisible();
  }

  const mypage = page.getByRole("link", { name: /마이페이지 홈/ });
  await expect(mypage).toBeVisible();
  await mypage.click();
  await expect(page).toHaveURL(/\/mypage$/);
});

test("다크 모드 토글을 누르면 html에 dark 클래스가 붙는다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "라이트 모드로 전환" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
