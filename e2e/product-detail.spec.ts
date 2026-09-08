// 상품 상세: 아이를 바꾸면 적합도가 함께 바뀌는지, 탭이 뒤로가기로 되돌아오는지 본다.
import { expect, test } from "@playwright/test";

const PATH = "/products/1";

test("아이를 바꾸면 적합도가 그 아이 기준으로 바뀐다", async ({ page }) => {
  await page.goto(PATH);

  await expect(page.getByRole("heading", { name: "소리와 잘 맞아요" })).toBeVisible();

  await page.getByRole("combobox", { name: "적합도 기준이 되는 아이" }).click();
  await page.getByRole("option", { name: "냥이 기준으로 보기" }).click();

  await expect(
    page.getByRole("heading", { name: "냥이 기준으로는 아직 재지 못했어요" }),
  ).toBeVisible();
});

// 재 봤더니 안 맞는 것과 아직 재지 않은 것은 다른 이야기다(#119).
// 0점으로 채워 두면 궁합이 나쁜 상품처럼 읽힌다.
test("재지 못한 아이에게는 점수를 채우지 않는다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("combobox", { name: "적합도 기준이 되는 아이" }).click();
  await page.getByRole("option", { name: "냥이 기준으로 보기" }).click();

  await expect(page.getByText("0점")).toHaveCount(0);
  await expect(
    page.getByText("냥이 기준의 급여량이 등록되지 않아 아직 분석하지 못했어요."),
  ).toBeVisible();
});

test("탭을 옮기면 그 탭 내용이 나오고 뒤로가기로 되돌아온다", async ({ page }) => {
  await page.goto(PATH);

  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeVisible();

  await page.getByRole("tab", { name: "Q&A" }).click();
  await expect(page.getByRole("link", { name: "문의하기" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeHidden();

  // nuqs 기본은 replace라, push로 두지 않으면 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다
  await page.goBack();
  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeVisible();
});

// 시안은 적정을 초록, 과다를 빨강으로만 구분한다. 색을 구분하기 어려운 사람에게는
// 아무것도 아니므로 값 옆에 구간 이름이 함께 읽혀야 한다.
test("영양 성분 구간을 색 말고 글자로도 알린다", async ({ page }) => {
  await page.goto(PATH);

  const nutrients = page.getByRole("region", { name: "영양 성분 분석" });
  await expect(nutrients.getByText("단백질 적정", { exact: false })).toBeAttached();
  await expect(nutrients.getByText("지방 과다", { exact: false })).toBeAttached();
});

test("찜을 누르면 담긴 상태로 남는다", async ({ page }) => {
  await page.goto(PATH);

  const like = page.getByRole("button", { name: "찜 목록에 담기" });
  await expect(like).toHaveAttribute("aria-pressed", "false");

  await like.click();
  await expect(page.getByRole("button", { name: "찜 목록에서 빼기" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
