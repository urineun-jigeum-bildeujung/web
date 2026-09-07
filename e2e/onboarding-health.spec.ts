// 온보딩 건강 단계: 시트에서 갈래를 옮겨 여러 개를 고르고, 고른 것이 되보이는지 본다.
import { expect, test } from "@playwright/test";

const PATH = "/onboarding?step=health";

test("갈래를 옮기면 그 갈래의 항목이 나온다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();

  // 관절·뼈 탭이 먼저 열린다
  await expect(page.getByRole("button", { name: "슬개골 탈구" })).toBeVisible();

  await page.getByRole("tab", { name: "체중·대사" }).click();
  await expect(page.getByRole("button", { name: "과체중·비만" })).toBeVisible();
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
  await page.getByRole("button", { name: "치석·플라그" }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  const picker = page.getByRole("button", { name: "걱정되는 질환" });
  await expect(picker).toContainText("슬개골 탈구");
  await expect(picker).toContainText("치석·플라그");
});

test("알러지는 성분 갈래로 나뉜다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "피해야 할 성분" }).click();

  await expect(page.getByRole("tab", { name: "육류" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "관절·뼈" })).toHaveCount(0);
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
  // ChipSelect는 라디오를 sr-only로 숨기고 레이블을 누르게 한다. 라디오를 직접
  // 누르면 레이블이 포인터를 가로채므로, 누르는 것은 레이블이고 확인은 role로 한다
  await page
    .getByRole("radiogroup", { name: "아이의 체구" })
    .getByText("소형견", { exact: true })
    .click();
  await expect(page.getByRole("radio", { name: "소형견" })).toBeChecked();

  await page.getByRole("button", { name: "체형이 무엇인지 보기" }).click();

  // 슬라이더 눈금에도 같은 말이 있어 시트 안으로 좁힌다
  const sheet = page.getByRole("dialog", { name: "bcs란?" });
  await expect(sheet).toBeVisible();
  // 다섯 단계를 이름과 설명으로 나열한다
  await expect(sheet.getByRole("term")).toHaveCount(5);
  await expect(sheet.getByRole("term").first()).toHaveText("매우 마름");
});

// 갈래가 여섯이라 시트가 세로로 길다. 낮은 화면에서 위쪽이 잘리면 탭을 못 고른다.
test("낮은 화면에서도 시트의 탭을 고를 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 300 });
  await page.goto(PATH);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();

  const sheet = page.getByRole("dialog", { name: "걱정되는 질환" });
  const box = await sheet.boundingBox();
  expect(box!.y, "시트가 화면 위로 잘렸다").toBeGreaterThanOrEqual(0);

  await expect(page.getByRole("tab", { name: "관절·뼈" })).toBeInViewport();
});

test("고른 칩은 색 말고 체크로도 알린다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();
  const chip = page.getByRole("button", { name: "슬개골 탈구" });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await expect(chip.locator("svg")).toHaveCount(0);

  await chip.click();
  // 색을 구분하기 어려운 사람도 고른 것을 알아야 한다. aria-pressed만으로는
  // 눈으로 보는 표시가 사라져도 통과하므로 아이콘이 붙는 것까지 함께 본다
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(chip.locator("svg")).toHaveCount(1);
});

// 온보딩에서 고른 값을 마이페이지에서 고친다. 한쪽만 자유 입력이면
// 같은 질환이 여러 표기로 쌓여 추천에 쓸 수 없다.
test("마이페이지 건강 정보도 같은 시트로 고른다", async ({ page }) => {
  await page.goto("/mypage/pets/health");

  const picker = page.getByRole("button", { name: "걱정되는 질환" });
  await expect(picker).toContainText("슬개골 탈구");

  await picker.click();
  await expect(page.getByRole("tab", { name: "관절·뼈" })).toBeVisible();

  await page.getByRole("button", { name: "관절염" }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  await expect(picker).toContainText("관절염");
});

test("해당 없음을 켠 자리는 해당 사항 없음으로 바뀐다", async ({ page }) => {
  await page.goto("/mypage/pets/health");

  // 알러지는 저장된 값이 해당 없음이다
  const allergy = page.getByRole("button", { name: "피해야 할 성분" });
  await expect(allergy).toBeDisabled();
  await expect(allergy).toContainText("해당 사항 없음");
});

// 질환 갈래가 종별로 다르다. 강아지로 고른 "슬개골 탈구"가 고양이 프로필에 남으면
// 추천 근거가 거짓이 된다.
//
// 입력값이 컴포넌트 상태라 goto로 단계를 건너뛰면 종이 기본값으로 되돌아간다.
// 화면 안에서 단계를 옮겨야 실제 흐름을 본다.
async function goToHealthAsCat(page: import("@playwright/test").Page) {
  await page.goto("/onboarding?step=detail");

  await page.getByRole("button", { name: /품종/ }).first().click();
  await page.getByRole("button", { name: "코리안 숏헤어", exact: true }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  // 체구와 몸무게를 채워야 다음으로 넘어간다
  await page
    .getByRole("radiogroup", { name: "아이의 체구" })
    .getByText("소형견", { exact: true })
    .click();
  await page.getByPlaceholder("평균 몸무게 5kg").fill("4");
  await page.getByRole("button", { name: "다음 단계 작성하기" }).click();
}

test("고양이를 고르면 고양이 갈래가 뜬다", async ({ page }) => {
  await goToHealthAsCat(page);

  await page.getByRole("button", { name: "걱정되는 질환" }).click();

  await expect(page.getByRole("tab", { name: "스트레스 행동" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "관절·뼈" })).toHaveCount(0);
});

test("종이 바뀌면 앞서 고른 질환을 비운다", async ({ page }) => {
  await page.goto("/onboarding?step=health");

  // 기본은 강아지다. 강아지 질환을 하나 고른다
  await page.getByRole("button", { name: "걱정되는 질환" }).click();
  await page.getByRole("button", { name: "슬개골 탈구" }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();
  await expect(page.getByRole("button", { name: "걱정되는 질환" })).toContainText("슬개골 탈구");

  // 이전으로 돌아가 품종을 고양이로 바꾼다
  await page.getByRole("button", { name: "이전" }).click();
  await page.getByRole("button", { name: /품종/ }).first().click();
  await page.getByRole("button", { name: "코리안 숏헤어", exact: true }).click();
  await page.getByRole("button", { name: "선택 완료" }).click();

  await page
    .getByRole("radiogroup", { name: "아이의 체구" })
    .getByText("소형견", { exact: true })
    .click();
  await page.getByPlaceholder("평균 몸무게 5kg").fill("4");
  await page.getByRole("button", { name: "다음 단계 작성하기" }).click();

  await expect(page.getByRole("button", { name: "걱정되는 질환" })).not.toContainText(
    "슬개골 탈구",
  );
});
