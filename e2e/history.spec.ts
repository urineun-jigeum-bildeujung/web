// 뒤로가기가 탭·단계 전환을 건너뛰지 않는지 본다.
// nuqs 기본값(replace)이면 히스토리에 쌓이지 않아 화면을 통째로 떠난다.
import { expect, test } from "@playwright/test";

test("좋아요 탭을 옮긴 뒤 뒤로가기로 돌아온다", async ({ page }) => {
  await page.goto("/likes");

  await page.getByRole("tab", { name: "최근에 봤어요" }).click();
  await expect(page).toHaveURL(/tab=recent/);

  await page.goBack();
  await expect(page).not.toHaveURL(/tab=recent/);
  // 화면을 떠나지 않고 좋아요에 남아 있어야 한다
  await expect(page).toHaveURL(/\/likes/);
});

test("메인에서 종류를 고른 뒤 뒤로가기로 전체 탭에 돌아온다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "사료", exact: true }).click();
  await expect(page).toHaveURL(/category=food/);

  await page.goBack();
  // 전체 탭은 큐레이션이라 종류 목록과 구성이 다르다
  await expect(page.getByText(/AI가 골라주는/)).toBeVisible();
});

test("온보딩에서 입력하다 뒤로가기를 눌러도 입력값이 남는다", async ({ page }) => {
  await page.goto("/onboarding");

  await page.getByRole("button", { name: "프로필 입력하기" }).click();
  await expect(page).toHaveURL(/step=basic/);

  // 시안에서 세 항목이 모두 차야 다음 버튼이 켜진다
  await page.getByLabel("아이의 이름을 알려주세요").fill("보리");
  await page
    .getByRole("radiogroup", { name: "아이의 성별" })
    .getByText("남자아이", { exact: true })
    .click();
  await page
    .getByRole("radiogroup", { name: "중성화 여부" })
    .getByText("했어요", { exact: true })
    .click();
  await page.getByRole("button", { name: "다음 단계 작성하기" }).click();
  await expect(page).toHaveURL(/step=detail/);

  await page.goBack();
  // 온보딩을 떠나지 않고 이전 단계로 돌아오며, 친 이름도 그대로다
  await expect(page).toHaveURL(/step=basic/);
  await expect(page.getByLabel("아이의 이름을 알려주세요")).toHaveValue("보리");
});

test("필터는 히스토리에 쌓이지 않는다", async ({ page }) => {
  await page.goto("/mypage/pets?tab=products");

  // 칩은 라디오를 숨기고 레이블을 누르게 되어 있다
  const filters = page.getByRole("radiogroup", { name: "후기 작성 여부로 거르기" });
  await filters.getByText("미입력", { exact: true }).click();
  await expect(page).toHaveURL(/reviewed=todo/);
  await filters.getByText("입력", { exact: true }).click();
  await expect(page).toHaveURL(/reviewed=done/);

  // 같은 목록을 좁히는 것이라 한 번에 탭 전환 이전으로 돌아가야 한다
  await page.goBack();
  await expect(page).not.toHaveURL(/tab=products/);
});
