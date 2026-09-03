// 메인 화면 E2E. 탭에 따라 화면이 통째로 바뀌는지, 상태 체크가 이어지는지 실제 브라우저에서 본다.
import { expect, test } from "@playwright/test";

test("메인이 렌더링된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("골라주개냥")).toBeVisible();
  await expect(page.getByText(/AI가 골라주는/)).toBeVisible();
});

test("종류를 고르면 상품 목록으로 바뀐다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "사료", exact: true }).click();
  await expect(page).toHaveURL(/category=food/);

  // 큐레이션 자리가 사라지고 정렬이 나온다
  await expect(page.getByText(/AI가 골라주는/)).toBeHidden();
  await expect(page.getByLabel("정렬")).toBeVisible();

  // 지금 어느 것을 보고 있는지 알린다
  await expect(page.getByRole("button", { name: "사료", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("반응을 남기면 어디에 쓰이는지 알린다", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: /반응 남기기/ })
    .first()
    .click();
  await page.getByRole("radio", { name: "잘 맞았어요" }).click();
  await page.getByRole("button", { name: "등록하기" }).click();

  await expect(page.getByText(/다음 추천 적합도에 반영할게요/)).toBeVisible();
});

test("만들어 둔 화면 목록은 개발용 경로로 갔다", async ({ page }) => {
  await page.goto("/dev/screens");

  for (const group of ["온보딩", "마이페이지"]) {
    await expect(page.getByRole("heading", { name: group })).toBeVisible();
  }

  const mypage = page.getByRole("link", { name: /마이페이지 홈/ });
  await mypage.click();
  await expect(page).toHaveURL(/\/mypage$/);
});

test("다크 모드 토글을 누르면 html에 dark 클래스가 붙는다", async ({ page }) => {
  await page.goto("/dev/screens");

  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "라이트 모드로 전환" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
