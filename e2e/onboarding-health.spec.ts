// 온보딩 건강 단계: 시트에서 갈래를 옮겨 여러 개를 고르고, 고른 것이 되보이는지 본다.
import { expect, test } from "@playwright/test";

const PATH = "/onboarding?step=health";

test("갈래를 옮기면 그 갈래의 항목이 나온다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();

  // 관절 탭이 먼저 열린다
  await expect(page.getByRole("button", { name: "슬개골 탈구" })).toBeVisible();

  await page.getByRole("tab", { name: "체중" }).click();
  await expect(page.getByRole("button", { name: "비만" })).toBeVisible();
  // 앞 갈래의 항목은 사라진다
  await expect(page.getByRole("button", { name: "슬개골 탈구" })).toBeHidden();
});

test("여러 개를 골라 완료하면 고른 것이 되보인다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();
  await page.getByRole("button", { name: "슬개골 탈구" }).click();
  await page.getByRole("button", { name: "관절염" }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  const picker = page.getByRole("button", { name: "걱정되는 질환" });
  await expect(picker).toContainText("슬개골 탈구");
  await expect(picker).toContainText("관절염");
});

test("갈래를 넘나들며 고른 것이 함께 남는다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();
  await page.getByRole("button", { name: "슬개골 탈구" }).click();
  await page.getByRole("tab", { name: "구강 관리" }).click();
  await page.getByRole("button", { name: "치석" }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  const picker = page.getByRole("button", { name: "걱정되는 질환" });
  await expect(picker).toContainText("슬개골 탈구");
  await expect(picker).toContainText("치석");
});

test("알러지는 성분 갈래로 나뉜다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "피해야 할 성분" }).click();

  await expect(page.getByRole("tab", { name: "육류" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "관절" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "닭고기" })).toBeVisible();
});

test("해당 없음을 켜면 고를 수 없다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByLabel("해당 사항이 없어요").first().check();

  await expect(page.getByRole("button", { name: "걱정되는 질환" })).toBeDisabled();
});

test("두 항목을 다 답해야 다음으로 넘어간다", async ({ page }) => {
  await page.goto(PATH);

  const next = page.getByRole("button", { name: "다음 단계 작성하기" });
  await expect(next).toBeDisabled();

  await page.getByRole("button", { name: "걱정되는 질환" }).click();
  await page.getByRole("button", { name: "슬개골 탈구" }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();
  // 아직 알러지가 남았다
  await expect(next).toBeDisabled();

  await page.getByLabel("해당 사항이 없어요").last().check();
  await expect(next).toBeEnabled();
});

test("체형 안내가 시트로 뜬다", async ({ page }) => {
  await page.goto("/onboarding?step=detail");

  // 체구를 골라야 몸무게·체형 항목이 나타난다(시안 onbo_003_체구선택후)
  await page
    .getByRole("radiogroup", { name: "아이의 체구" })
    .getByText("소형견", { exact: true })
    .click();

  await page.getByRole("button", { name: "체형이 무엇인지 보기" }).click();

  // 슬라이더 눈금에도 같은 말이 있어 시트 안으로 좁힌다
  const sheet = page.getByRole("dialog", { name: "bcs란?" });
  await expect(sheet).toBeVisible();
  // 다섯 단계를 이름과 설명으로 나열한다
  await expect(sheet.getByRole("term")).toHaveCount(5);
  await expect(sheet.getByRole("term").first()).toHaveText("매우 마름");
});
