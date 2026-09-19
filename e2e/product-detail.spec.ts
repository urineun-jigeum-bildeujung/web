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
  // Q&A 탭은 문의 목록을 담는다(#153). 예전의 빈 문구와 문의하기 버튼은 없어졌다
  await expect(page.getByRole("link", { name: "상품 문의" })).toBeVisible();
  await expect(page.getByText("하루에 몇 알씩 급여하면 되나요?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeHidden();

  // nuqs 기본은 replace라, push로 두지 않으면 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다
  await page.goBack();
  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeVisible();
});

// 시안은 적정을 초록, 과다를 빨강으로만 구분한다. 색을 구분하기 어려운 사람에게는
// 아무것도 아니므로 막대 아래 부족/적정/과다 줄에서 지금 구간만 글자로 진하게 드러나야 한다.
test("영양 성분 구간을 색 말고 글자로도 알린다", async ({ page }) => {
  await page.goto(PATH);

  const nutrients = page.getByRole("region", { name: "영양 성분 분석" });

  // 값 배지는 숫자만 적는다. 구간 이름은 그 아래 부족/적정/과다 줄이 맡는다
  await expect(nutrients.getByText("28%", { exact: true })).toBeVisible();
  await expect(nutrients.getByText("12%", { exact: true })).toBeVisible();
  // 절대 기준치가 없는 성분에는 구간 이름을 붙이지 않는다
  await expect(nutrients.getByText("3%", { exact: true })).toBeVisible();

  // 단백질(28%)은 적정 구간이라 "적정"만 진하게, 나머지 둘은 옅게 표시된다
  const protein = nutrients.locator("li", { hasText: "단백질" });
  await expect(protein.getByText("적정", { exact: true })).toHaveClass(/text-text-body-default/);
  await expect(protein.getByText("부족", { exact: true })).toHaveClass(/text-text-body-tertiary/);
  await expect(protein.getByText("과다", { exact: true })).toHaveClass(/text-text-body-tertiary/);

  // 지방(12%)은 과다 구간이다
  const fat = nutrients.locator("li", { hasText: "지방" });
  await expect(fat.getByText("과다", { exact: true })).toHaveClass(/text-text-body-default/);

  // 오메가3(3%)는 절대 기준치가 없어 부족/적정/과다 줄 자체가 없다
  const omega = nutrients.locator("li", { hasText: "오메가3" });
  await expect(omega.getByText("부족", { exact: true })).toHaveCount(0);
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

test("장바구니를 누르면 옵션 시트에서 수량을 고른 뒤 담을 수 있다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "면역 지원 영양제 90정 옵션 선택" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("90정 (기본 구성)")).toBeVisible();

  await sheet.getByRole("button", { name: "면역 지원 영양제 90정 수량 하나 늘리기" }).click();
  await sheet.getByRole("button", { name: "42,000원 장바구니 담기" }).click();

  await expect(sheet).toBeHidden();
  await expect(page.getByText("상품이 장바구니에 담겼어요")).toBeVisible();
});

// 복사한 척만 하면 사용자는 붙여넣을 것이 없는 채로 나간다.
test("공유를 누르면 현재 주소가 클립보드에 담긴다", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(PATH);

  await page.getByRole("button", { name: "공유하기" }).click();
  await expect(page.getByText("링크를 복사했어요")).toBeVisible();

  // 경로 일부만 보면 호스트나 쿼리가 달라도 통과한다. 주소 전체를 견준다
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(page.url());
});

// 값이 양 끝에 붙는 성분(지방 86%)에서 배지가 화면 밖으로 밀려 글자가 잘렸다.
test("영양 배지가 화면 밖으로 넘치지 않는다", async ({ page }) => {
  await page.goto(PATH);

  const nutrients = page.getByRole("region", { name: "영양 성분 분석" });
  const area = (await nutrients.boundingBox())!;

  for (const label of ["28%", "12%", "5%", "3%"]) {
    const badge = (await nutrients.getByText(label, { exact: true }).boundingBox())!;
    expect(badge.x, `${label} 배지가 왼쪽으로 넘쳤다`).toBeGreaterThanOrEqual(area.x);
    expect(badge.x + badge.width, `${label} 배지가 오른쪽으로 넘쳤다`).toBeLessThanOrEqual(
      area.x + area.width,
    );
  }
});
