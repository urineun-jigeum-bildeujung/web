// 사진 리뷰: 리뷰 탭에서 격자를 거쳐 사진 한 장까지 가는 길이 이어지는지 본다.
import { expect, test } from "@playwright/test";

// 사진을 열면 주소가 바뀌어야 공유되고, 뒤로가기가 격자로 돌아와야 한다.
// nuqs 기본인 replace로 두면 격자를 건너뛰고 상품 상세로 나간다(#151).
test("리뷰 탭에서 사진을 골라 열고 뒤로가기로 격자에 돌아온다", async ({ page }) => {
  await page.goto("/products/1?tab=review");

  await page.getByRole("link", { name: "전체보기" }).click();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);
  await expect(page.getByRole("heading", { name: "사진 리뷰 전체보기" })).toBeVisible();

  await page
    .getByRole("button", { name: /크게 보기/ })
    .first()
    .click();

  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  await expect(page).toHaveURL(/[?&]review=0/);
  // 사진만 보고는 왜 찍었는지 알 수 없다. 그 사진을 남긴 후기가 함께 와야 한다.
  // 닉네임은 스크린 리더용 설명에도 들어 있어 후기 카드 안에서 찾는다
  const card = viewer.getByRole("article");
  await expect(card.getByText("댕댕이짱", { exact: true })).toBeVisible();
  await expect(card.getByText("말티즈 · 8세 · 4kg")).toBeVisible();

  await page.goBack();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);
});

test("좌우로 넘기면 같은 후기의 다른 사진으로 이동한다", async ({ page }) => {
  await page.goto("/products/1/photos?review=0&photo=0");

  const viewer = page.getByRole("dialog");
  await expect(viewer.getByText("3장 중 1번째")).toBeVisible();
  // 첫 장에서는 뒤로 갈 곳이 없다
  await expect(page.getByRole("button", { name: "이전 사진" })).toBeDisabled();

  await page.getByRole("button", { name: "다음 사진" }).click();
  await expect(viewer.getByText("3장 중 2번째")).toBeVisible();

  await page.getByRole("button", { name: "다음 사진" }).click();
  await expect(viewer.getByText("3장 중 3번째")).toBeVisible();
  await expect(page.getByRole("button", { name: "다음 사진" })).toBeDisabled();
});

test("닫으면 격자로 돌아온다", async ({ page }) => {
  await page.goto("/products/1/photos?review=1&photo=0");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "닫기" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);
});

// 주소는 사람이 고칠 수 있다
test("없는 후기를 가리키면 격자만 보인다", async ({ page }) => {
  await page.goto("/products/1/photos?review=99");

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("heading", { name: "사진 리뷰 전체보기" })).toBeVisible();
});
