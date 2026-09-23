// 상품 상세: 응답이 화면에 그대로 닿는지, 아이를 바꾸면 적합도가 함께 바뀌는지,
// 탭이 뒤로가기로 되돌아오는지 본다.
//
// 상품 상세는 서버 컴포넌트가 직접 부른다(#413). Next 서버 프로세스가 보내는 요청은
// 브라우저 page.route()로 못 가로채, `playwright.server-fetch.config.ts`가 이 스펙 전용
// 목 API 서버(`mock-api-server.mjs`)와 전용 포트의 Next 서버를 따로 띄운다.
//
// 적합도·영양 분석·문의는 아직 목이고(#123, #339), 배송·판매자·제공고시 두 줄도
// 응답에 자리가 없어 고정 목데이터다.
import { expect, test } from "@playwright/test";
import { stubAddToCart } from "./fixtures/cart";

const PATH = "/products/1";
/** 목 API 서버가 주는 값. 목록 목데이터와 일부러 다른 이름·가격이다 */
const NAME = "관절 튼튼 영양제 90정";

// 화면이 목이던 시절엔 어느 상품을 열어도 같은 값이었다. 응답에서 온 값인지 보려고
// 목 API 서버가 목록 목데이터와 다른 이름·가격을 준다.
test("응답의 상품이 상단 요약에 그대로 그려진다", async ({ page }) => {
  await page.goto(PATH);

  // 별점·후기 수는 리뷰 탭에도 같은 값이 있다. 상단 요약 안으로 좁혀 본다
  const summary = page.getByRole("region", { name: NAME });

  await expect(page.getByRole("heading", { name: NAME, level: 1 })).toBeVisible();
  await expect(summary.getByText("18,000원")).toBeVisible();
  await expect(summary.getByText("24,000원")).toBeVisible();
  // 서버가 준 할인율을 쓴다. 두 금액으로 다시 계산하지 않는다
  await expect(summary.getByText("25%")).toBeVisible();
  await expect(summary.getByText("4.7")).toBeVisible();
  await expect(summary.getByRole("button", { name: "후기 312" })).toBeVisible();
});

test("상세 설명 표가 응답으로 채워지고 빈 항목은 줄째로 빠진다", async ({ page }) => {
  await page.goto(PATH);

  const spec = page.getByRole("region", { name: "상세 설명" });

  await expect(spec.getByText("이엠펫푸드 / 조인트케어")).toBeVisible();
  // 급여 대상은 종부터 적는다. 종을 빼면 이 상품이 누구 것인지가 사라진다
  await expect(spec.getByText("강아지 · 8세 이상 · 소형 · 노령")).toBeVisible();
  await expect(spec.getByText("글루코사민, MSM")).toBeVisible();
  // 응답의 allergens는 들어 있는 성분이다. 옛 목 문구("계란 · 유제품 불포함")와 뜻이 반대다
  await expect(spec.getByText("계란", { exact: true })).toBeVisible();
  await expect(spec.getByText("제조일로부터 18개월 · 개봉 후 60일")).toBeVisible();

  // 제조국·보관방법은 목 응답에서 비어 온다. 항목명만 남은 줄을 그리지 않는다
  await expect(spec.getByText("제조국")).toHaveCount(0);
  await expect(spec.getByText("보관방법")).toHaveCount(0);
});

test("제공고시 품명은 응답의 상품명을 쓴다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "상품정보 제공고시" }).click();

  await expect(page.getByText("품명 및 모델명")).toBeVisible();
  // 배송·판매자·수입식품 여부·상담 전화는 응답에 자리가 없어 아직 고정 목데이터다
  await expect(page.getByText("해당 없음")).toBeVisible();
});

test("없는 상품은 404 화면으로 간다", async ({ page }) => {
  const response = await page.goto("/products/9999");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: NAME, level: 1 })).toHaveCount(0);
});

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

// 시안은 부족/적정/과다를 색으로만 구분한다(굵기는 셋 다 같다). 그 줄은
// aria-hidden이라 화면 낭독기는 값 배지의 접근성 이름("12%, 과다")으로 듣는다.
test("영양 성분 구간을 색 말고 글자로도 알린다", async ({ page }) => {
  await page.goto(PATH);

  const nutrients = page.getByRole("region", { name: "영양 성분 분석" });

  // 값 배지는 눈에는 숫자만 보이지만, 접근성 이름엔 구간이 함께 실린다
  await expect(nutrients.getByText("28%", { exact: true })).toHaveAttribute(
    "aria-label",
    "28%, 적정",
  );
  await expect(nutrients.getByText("12%", { exact: true })).toHaveAttribute(
    "aria-label",
    "12%, 과다",
  );
  // 절대 기준치가 없는 성분은 구간이 없어 접근성 이름도 값 그대로다
  const omegaBadge = nutrients.getByText("3%", { exact: true });
  await expect(omegaBadge).toBeVisible();
  await expect(omegaBadge).not.toHaveAttribute("aria-label");

  // 단백질(28%)은 적정 구간이라 "적정"만 진한 색, 나머지 둘은 옅은 색으로 표시된다
  const protein = nutrients.getByRole("listitem").filter({ hasText: "단백질" });
  await expect(protein.getByText("적정", { exact: true })).toHaveClass(/text-text-body-default/);
  await expect(protein.getByText("부족", { exact: true })).toHaveClass(/text-text-body-tertiary/);
  await expect(protein.getByText("과다", { exact: true })).toHaveClass(/text-text-body-tertiary/);

  // 지방(12%)은 과다 구간이다
  const fat = nutrients.getByRole("listitem").filter({ hasText: "지방" });
  await expect(fat.getByText("과다", { exact: true })).toHaveClass(/text-text-body-default/);

  // 오메가3(3%)는 절대 기준치가 없어 부족/적정/과다 줄 자체가 없다
  const omega = nutrients.getByRole("listitem").filter({ hasText: "오메가3" });
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

test("장바구니를 누르면 수량 시트에서 수량을 고른 뒤 담을 수 있다", async ({ page }) => {
  // 담기가 서버를 부른다. 실패하면 시트가 열린 채 남는 것이 의도된 동작이라 세워 둔다 (#316)
  await stubAddToCart(page);
  await page.goto(PATH);

  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: `${NAME} 수량 고르기` });
  await expect(sheet).toBeVisible();
  // 고를 옵션은 없다(#137). 남는 것은 지금 담는 것이 무엇인지 알리는 용량뿐이다
  // 상품명에도 "90정"이 들어 있어 정확히 일치하는 것만 본다
  await expect(sheet.getByText("90정", { exact: true })).toBeVisible();

  await sheet.getByRole("button", { name: `${NAME} 수량 하나 늘리기` }).click();
  await sheet.getByRole("button", { name: "36,000원 장바구니 담기" }).click();

  await expect(sheet).toBeHidden();
  await expect(page.getByText("상품이 장바구니에 담겼어요")).toBeVisible();
});

// 타임딜 상품을 그냥 상품으로 담으면 딜가가 아니라 정가로 들어간다(#413).
test("타임딜 상품은 딜 아이템 식별자로 담는다", async ({ page }) => {
  const sent: string[] = [];
  await page.route("**/api/v1/carts/items", (route) => {
    sent.push(route.request().postData() ?? "");
    return route.fulfill({ status: 201, body: "" });
  });
  await page.goto("/products/101");

  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await page.getByRole("button", { name: "18,000원 장바구니 담기" }).click();

  await expect(page.getByText("상품이 장바구니에 담겼어요")).toBeVisible();
  expect(JSON.parse(sent[0])).toMatchObject({ itemType: "TIME_DEAL", itemId: 77 });
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
