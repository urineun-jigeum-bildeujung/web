// 홈 화면 E2E. 초기 세팅 페이지가 뜨고 다크 모드 토글이 실제 브라우저에서 동작하는지 검증한다.
import { expect, test } from "@playwright/test";

test("홈 화면이 렌더링된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "골라주개냥" })).toBeVisible();
  await expect(page.getByText("프론트엔드 초기 세팅 단계", { exact: false })).toBeVisible();
});

test("다크 모드 토글을 누르면 html에 dark 클래스가 붙는다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "라이트 모드로 전환" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
