// 리뷰 작성: 다 채워야 등록되는지, 사진을 붙였다 뺄 수 있는지 본다.
import { expect, test } from "@playwright/test";

const PATH = "/mypage/reviews/write?orderItemId=oi1";

// 1×1 투명 PNG. 실제 파일 없이 첨부를 시험한다
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

type Page = import("@playwright/test").Page;

/** 같은 이름의 보기가 여러 묶음에 있어 묶음을 먼저 좁힌다 */
async function pickChip(page: Page, group: string, option: string) {
  await page.getByRole("radiogroup", { name: group }).getByText(option, { exact: true }).click();
}

async function fillAll(page: Page) {
  await page.getByRole("radio", { name: "5점 만점에 4점" }).click();
  await page.getByLabel("사용 기간").fill("16");
  // 칩은 라디오를 숨기고 레이블을 누르게 되어 있다. 사람이 누르는 자리가 레이블이다
  await pickChip(page, "기호성 — 잘 먹었나요?", "잘 먹어요");
  await pickChip(page, "소화 반응 — 아이 배변 상태는 어땠나요?", "좋아졌어요");
  await pickChip(page, "급여 편의성(정제 크기 등) — 아이에게 급여하기 편했나요?", "보통이에요");
  await page.getByRole("radio", { name: "소리" }).click();
  await page
    .getByLabel("다른 보호자에게 도움이 되는 후기")
    .fill("확실히 예전보다 계단 오를 때 덜 힘들어해요");
}

test("아이의 반응을 다 채워야 등록된다", async ({ page }) => {
  await page.goto(PATH);

  const submit = page.getByRole("button", { name: "리뷰 등록하기" });
  await expect(submit).toBeDisabled();

  await fillAll(page);
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(page.getByText("소중한 리뷰 감사해요!")).toBeVisible();
  // 어느 아이의 후기인지 짚는다. 받침 없는 이름이라 "소리가"다
  await expect(page.getByText(/소리가 어땠는지/)).toBeVisible();
});

test("사진은 세 장까지 붙이고 뺄 수 있다", async ({ page }) => {
  await page.goto(PATH);

  const input = page.locator('input[type="file"]');
  await input.setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: PNG },
    { name: "b.png", mimeType: "image/png", buffer: PNG },
    { name: "c.png", mimeType: "image/png", buffer: PNG },
  ]);

  await expect(page.getByRole("button", { name: /사진 빼기/ })).toHaveCount(3);
  // 다 채우면 더할 자리가 사라진다
  await expect(input).toHaveCount(0);

  await page.getByRole("button", { name: "1번째 사진 빼기" }).click();
  await expect(page.getByRole("button", { name: /사진 빼기/ })).toHaveCount(2);
  await expect(page.getByText("2/3")).toBeVisible();
});
