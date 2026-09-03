// 타임딜: 탭이 주소에 남는지, 목록에서 바로 담기는지 본다.
import { expect, test } from "@playwright/test";

test("탭을 옮기면 주소에 남고 뒤로가기로 돌아온다", async ({ page }) => {
  await page.goto("/deals");
  await expect(page.getByText("종료까지 남은 시간")).toBeVisible();

  await page.getByRole("tab", { name: "오픈 예정" }).click();
  await expect(page).toHaveURL(/tab=upcoming/);
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();

  await page.goBack();
  await expect(page.getByText("종료까지 남은 시간")).toBeVisible();
});

test("목록에서 옵션을 골라 바로 담는다", async ({ page }) => {
  await page.goto("/deals");

  await page.getByLabel("면역 지원 영양제 90정 장바구니에 담기").click();
  await page.getByLabel("면역 지원 영양제 90정 수량 하나 늘리기").click();
  await page.getByRole("button", { name: "42,000원 장바구니 담기" }).click();

  await expect(page.getByLabel("면역 지원 영양제 90정 장바구니에 담김")).toBeVisible();
  await expect(page.getByText("장바구니에 담겼어요")).toBeVisible();
});
