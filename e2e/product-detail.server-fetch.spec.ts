// 상품 상세: 응답이 화면에 그대로 닿는지, 아이를 바꾸면 적합도가 함께 바뀌는지,
// 탭이 뒤로가기로 되돌아오는지 본다.
//
// 상품 상세는 서버 컴포넌트가 직접 부른다(#413). Next 서버 프로세스가 보내는 요청은
// 브라우저 page.route()로 못 가로채, `playwright.server-fetch.config.ts`가 이 스펙 전용
// 목 API 서버(`mock-api-server.mjs`)와 전용 포트의 Next 서버를 따로 띄운다.
//
// 적합도의 아이는 로그인한 보호자의 실제 아이다(#481). 아이 조회는 브라우저가 부르므로
// page.route로 세운다. Safety 분석은 브라우저가 전용 mock API의 Nutrition endpoint를 실제 호출한다(#572).
// 영양 점수·수치 계약은 아직 없어 화면에서 지어내지 않는다. 문의는 아직 목이고(#339), 상단 요약의 배송·판매자
// 줄도 응답에 자리가 없어 고정 목데이터다. 아래 세 안내는 목이 아니라 PD가 확정한 고정 문구다(#555).
import { expect, test, type Page } from "@playwright/test";
import { stubAddToCart, stubCart } from "./fixtures/cart";
import { stubNotifications } from "./fixtures/notifications";
import { stubPetCatalog } from "./fixtures/pet-catalog";
import { signIn } from "./fixtures/session";
import { stubWishlist } from "./fixtures/wishlist";

const PATH = "/products/1";
/** 목 API 서버가 주는 값. 목록 목데이터와 일부러 다른 이름·가격이다 */
const NAME = "관절 튼튼 영양제 90정";

/** 로그인하고 내 아이 둘(코코·보리)을 세운다. 헤더의 알림·장바구니도 로그인하면 서버를 부른다 */
async function signInWithPets(page: Page) {
  await signIn(page);
  await stubPetCatalog(page);
  await stubNotifications(page);
  await stubCart(page);
  // 로그인하면 하단 하트·함께 보면 좋은 상품이 찜을 부른다(#483). 따로 세우는 테스트가 덮는다
  await stubWishlist(page);
}

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
  await expect(summary.getByRole("button", { name: "후기 312개" })).toBeVisible();
});

// 보는 것은 **응답의 사진이 화면에 닿고 캐러셀이 움직이는가**다. 목 응답이 사진을 비워 두면
// 그 경로를 한 번도 지나지 않아, 사진이 안 뜨는 문제를 E2E가 못 잡는다.
//
// 목 사진은 앱과 같은 출처(`public/images/e2e/`)를 가리킨다. 운영 CDN 호스트 허용 여부는
// 자동화 범위 밖이고, 백엔드가 실제 이미지 호스트를 확정한 뒤 따로 확인한다.
test("응답의 사진이 실제로 그려지고 넘기면 현재 위치 점이 따라온다", async ({ page }) => {
  await page.goto(PATH);

  // 두 장째 alt가 "<이름> 사진 2"라 이름으로만 찾으면 둘이 걸린다
  const first = page.getByRole("img", { name: NAME, exact: true });
  await expect(first).toBeVisible();

  // 깨진 이미지는 폭이 0이다. 주소 형식은 보지 않는다 — Next 내부 구현에 붙을 이유가 없다
  await expect
    .poll(() => first.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);

  // 두 장째는 넘겨야 보이므로 접근성 이름에 순번이 붙는다
  await expect(page.getByRole("img", { name: `${NAME} 사진 2` })).toBeAttached();

  // 점은 사진 장수와 같아야 한다. 예전에는 셋으로 못박혀 있었다
  const dots = page.locator("span.size-1\\.5");
  await expect(dots).toHaveCount(2);
  await expect(dots.nth(0)).toHaveClass(/bg-foreground/);

  // 한 장 넘기면 진한 점이 두 번째로 옮겨간다.
  //
  // **스크롤 핸들러가 붙기 전에 밀면 점이 그대로 남는다.** 점은 React 상태로 그려지는데
  // 하이드레이션이 늦은 환경(CI)에서는 첫 밀기가 그냥 지나간다. 그래서 되돌렸다 다시 미는
  // 것까지 묶어 재시도한다 — 같은 자리로 다시 밀면 스크롤 이벤트가 나지 않는다
  const carousel = page.locator("div.snap-x");
  await expect(async () => {
    await carousel.evaluate((el) => el.scrollTo({ left: 0 }));
    await carousel.evaluate((el) => el.scrollTo({ left: el.clientWidth }));
    await expect(dots.nth(1)).toHaveClass(/bg-foreground/, { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await expect(dots.nth(0)).not.toHaveClass(/bg-foreground/);
});

test("상세 설명 표가 응답으로 채워지고 빈 항목은 줄째로 빠진다", async ({ page }) => {
  await page.goto(PATH);

  const spec = page.getByRole("region", { name: "상세 설명" });

  await expect(spec.getByText("이엠펫푸드 / 조인트케어")).toBeVisible();
  // 급여 대상은 체구 뒤에 종 접미를 붙인 한 문구다. targetAgeGroup("노령")은 적지 않는다
  await expect(spec.getByText("8세 이상 소형견")).toBeVisible();
  await expect(spec.getByText("글루코사민, MSM")).toBeVisible();
  // 응답의 allergens는 들어 있는 성분이라 뒤에 "포함"을 붙인다. 시안 문구("계란 · 유제품
  // 불포함")와 뜻이 반대여서, 성분명만 적으면 없는 성분으로 읽힌다
  await expect(spec.getByText("알레르기 정보")).toBeVisible();
  await expect(spec.getByText("계란 포함", { exact: true })).toBeVisible();
  await expect(spec.getByText("제조일로부터 18개월")).toBeVisible();

  // 제조국·보관방법은 목 응답에서 비어 온다. 항목명만 남은 줄을 그리지 않는다
  await expect(spec.getByText("제조국")).toHaveCount(0);
  await expect(spec.getByText("보관방법")).toHaveCount(0);
});

// PD가 세 항목을 모두 고정값으로 확정해 제공고시도 서버 값을 쓰지 않는다 (#555).
// 품명 자리가 응답의 상품명으로 되돌아가거나 자리표시 상담 번호가 되살아나면 실패한다
test("세 안내는 응답과 무관한 고정 문구를 쓴다", async ({ page }) => {
  await page.goto(PATH);

  await page.getByRole("button", { name: "상품정보 제공고시" }).click();
  const notice = page.getByRole("region", { name: "상품정보 제공고시" });
  await expect(notice.getByText("품명 및 모델명: 상품 상단 및 상세설명 별도 표기")).toBeVisible();
  await expect(notice.getByText(NAME, { exact: true })).toHaveCount(0);
  await expect(notice.getByText("1234-5678")).toHaveCount(0);

  // 셋 다 펼쳐 본다. 아코디언이 하나만 열리므로 앞의 것은 닫힌다
  await page.getByRole("button", { name: "배송 안내" }).click();
  const shipping = page.getByRole("region", { name: "배송 안내" });
  await expect(shipping.getByText("기본 배송비: 3,000원")).toBeVisible();

  await page.getByRole("button", { name: "교환/반품/환불 안내" }).click();
  const returns = page.getByRole("region", { name: "교환/반품/환불 안내" });
  await expect(returns.getByText("지정 택배사: CJ대한통운")).toBeVisible();
});

test("없는 상품은 404 화면으로 간다", async ({ page }) => {
  const response = await page.goto("/products/9999");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: NAME, level: 1 })).toHaveCount(0);
});

// 예시 아이("소리")를 그리던 동안 내 아이가 누구든 남의 이름이 근거에까지 박혀 떴다 (#481)
test("적합도는 내 아이 기준이고 아이를 바꾸면 함께 바뀐다", async ({ page }) => {
  await signInWithPets(page);
  await page.goto(PATH);

  // 스텁의 기본 아이 코코는 Nutrition mock에서 NO_CONFLICT_DETECTED를 받는다.
  await expect(
    page.getByRole("heading", { name: "코코 기준으로 확인한 안전 정보예요" }),
  ).toBeVisible();
  await expect(page.getByText("(말티즈 · 4세 · 4kg 기준)")).toBeVisible();
  await expect(
    page.getByText(
      "현재 등록 정보와 확인 가능한 상품 정보 기준으로 충돌이 확인되지 않았습니다.",
    ),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "적합도 기준이 되는 아이" }).click();
  await page.getByRole("option", { name: "보리 기준으로 보기" }).click();

  // 보리는 Nutrition mock에서 species mismatch Safety Block을 받는다.
  await expect(
    page.getByRole("heading", { name: "보리 기준으로 확인한 안전 정보예요" }),
  ).toBeVisible();
  await expect(page.getByText("반려동물 종과 상품 대상 종이 일치하지 않습니다.")).toBeVisible();
});

// Safety 결과와 영양 적합도 점수는 별개다. 점수 계약이 없으므로 0점이나 예시값을 채우지 않는다.
test("Safety 결과가 있어도 영양 점수는 지어내지 않는다", async ({ page }) => {
  await signInWithPets(page);
  await page.goto(PATH);

  await expect(page.getByText("코코 기준으로는 아직 분석하지 못했어요.")).toBeVisible();
  await expect(page.getByText("0점")).toHaveCount(0);
  await expect(page.getByText("92점")).toHaveCount(0);
});

// 예시 상품 셋은 없는 상품이라 누를 수 없었다(#481). 라우트가 기다리지 않고 넘긴 목록을
// 화면이 읽는 길이라 단위 테스트로는 이어지는지 못 본다
test("함께 보면 좋은 상품은 지금 상품을 뺀 인기순 실제 상품이다", async ({ page }) => {
  await page.goto(PATH);

  const related = page.getByRole("region", { name: "함께 보면 좋은 상품" });
  const card = related.getByRole("link", { name: /노령견 저지방 소화케어 사료 1kg/ });
  await expect(card).toHaveAttribute("href", "/products/2");
  await expect(card.getByText("1g당 약 27원")).toBeVisible();
  // 목 목록의 1번이 지금 보는 상품이다. 상세 목과 이름이 달라 목록 쪽 이름으로 본다
  await expect(related.getByText("중소형견 소포장 사료 1kg")).toHaveCount(0);
});

test("탭을 옮기면 그 탭 내용이 나오고 뒤로가기로 되돌아온다", async ({ page }) => {
  await page.goto(PATH);

  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeVisible();

  // 상품 문의는 이번 MVP 범위 밖이라 탭을 막아 뒀다(#549) — 옮길 수 있는 탭은 리뷰뿐이다
  await expect(page.getByRole("tab", { name: "Q&A" })).toBeDisabled();

  await page.getByRole("tab", { name: "리뷰" }).click();
  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeHidden();

  // nuqs 기본은 replace라, push로 두지 않으면 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다
  await page.goBack();
  await expect(page.getByRole("heading", { name: "영양 성분 분석" })).toBeVisible();
});

// 실제 영양 수치 계약이 붙기 전에는 예시 막대를 노출하지 않는다.
test("영양 성분 분석은 mock 수치 대신 미분석 상태를 보여준다", async ({ page }) => {
  await signInWithPets(page);
  await page.goto(PATH);

  const nutrients = page.getByRole("region", { name: "영양 성분 분석" });
  await expect(nutrients.getByText("코코 기준으로는 아직 분석하지 못했어요.")).toBeVisible();
  await expect(nutrients.getByText("28%", { exact: true })).toHaveCount(0);
  await expect(nutrients.getByText("12%", { exact: true })).toHaveCount(0);
  await expect(page.getByText("종합 92점")).toHaveCount(0);
});

// 로그인하지 않았으면 찜 대신 로그인 필요 토스트만 띄운다 (#483, #542)
test("로그인하지 않고 찜을 누르면 이동하지 않고 로그인 필요를 알린다", async ({ page }) => {
  await page.goto(PATH);
  // 로그인 여부를 아는 것은 하이드레이션 뒤다. 그전에는 적합도 자리의 뼈대가 있다
  await expect(page.getByRole("status", { name: "적합도를 불러오는 중" })).toHaveCount(0);

  await page.getByRole("button", { name: "찜 목록에 담기" }).click();

  await expect(page.getByText("로그인 필요")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${PATH}$`));
});

// 비로그인은 이 화면을 볼 수 있지만 담지는 못한다. 수량 시트를 열기 전에 막는다 (#542)
test("로그인하지 않고 장바구니를 누르면 수량 시트 대신 로그인 필요를 알린다", async ({ page }) => {
  await page.goto(PATH);
  await expect(page.getByRole("status", { name: "적합도를 불러오는 중" })).toHaveCount(0);

  await page.getByRole("button", { name: "장바구니", exact: true }).click();

  await expect(page.getByText("로그인 필요")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도 뜨지 않았다 (#483)
test("로그인하고 찜을 누르면 서버에 걸려 새로고침해도 남는다", async ({ page }) => {
  await signInWithPets(page);
  const wishlist = await stubWishlist(page);
  await page.goto(PATH);
  // 하이드레이션 뒤에만 뜬다. 그전에 누르면 아무 일도 없다
  await expect(page.getByRole("heading", { name: "코코 기준으로 확인한 안전 정보예요" })).toBeVisible();

  const like = page.getByRole("button", { name: "찜 목록에 담기" });
  await expect(like).toHaveAttribute("aria-pressed", "false");
  // 화면은 낙관적으로 먼저 바뀐다. 요청이 끝난 뒤에 기록을 보고 새로고침해야 흔들리지 않는다
  const patched = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" && response.url().endsWith("/members/me/wishlist/1"),
  );
  await like.click();
  await patched;

  const liked = page.getByRole("button", { name: "찜 목록에서 빼기" });
  await expect(liked).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("해당 상품을 찜 목록에 담았어요!")).toBeVisible();
  expect(wishlist.toggled).toEqual([1]);

  await page.reload();
  await expect(liked).toHaveAttribute("aria-pressed", "true");
});

test("함께 보면 좋은 상품의 하트는 찜 목록으로 채우고 누르면 그 상품을 뒤집는다", async ({
  page,
}) => {
  await signInWithPets(page);
  const wishlist = await stubWishlist(page, { wished: [2] });
  await page.goto(PATH);

  const related = page.getByRole("region", { name: "함께 보면 좋은 상품" });
  const senior = related.getByRole("button", { name: "노령견 저지방 소화케어 사료 1kg 찜하기" });
  await expect(senior).toHaveAttribute("aria-pressed", "true");

  const allergy = related.getByRole("button", { name: "알레르기 케어 무곡물 사료 1kg 찜하기" });
  // 화면은 낙관적으로 먼저 바뀐다. 요청이 끝난 뒤에 기록을 보고 새로고침해야 흔들리지 않는다
  const patched = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" && response.url().endsWith("/members/me/wishlist/3"),
  );
  await allergy.click();
  await patched;
  await expect(allergy).toHaveAttribute("aria-pressed", "true");
  expect(wishlist.toggled).toEqual([3]);
});

test("장바구니를 누르면 수량 시트에서 수량을 고른 뒤 담을 수 있다", async ({ page }) => {
  // 담기는 로그인해야 한다(#542)
  await signInWithPets(page);
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
// 딜가·딜 번호는 일반 상품 상세에 오지 않아, 타임딜에서 온 주소의 딜 번호로 타임딜 상세를 받는다(#484)
test("타임딜에서 들어오면 딜가로 보이고 딜 아이템 식별자로 담는다", async ({ page }) => {
  // 담기는 로그인해야 한다(#542)
  await signInWithPets(page);
  const sent: string[] = [];
  await page.route("**/api/v1/carts/items", (route) => {
    sent.push(route.request().postData() ?? "");
    return route.fulfill({ status: 201, body: "" });
  });
  await page.goto("/products/101?dealItem=1");

  const summary = page.getByRole("region", { name: "오리&고구마 소형견 사료 1.5kg" });
  await expect(summary.getByText("24,000원")).toBeVisible();

  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await page.getByRole("button", { name: "24,000원 장바구니 담기" }).click();

  await expect(page.getByText("상품이 장바구니에 담겼어요")).toBeVisible();
  expect(JSON.parse(sent[0])).toMatchObject({ itemType: "TIME_DEAL", itemId: 1 });
});

// 딜 번호 없이 들어오면(검색·추천) 서버가 주는 대로 일반 상품이다. 딜가를 지어내지 않는다
test("딜 번호 없이 열면 정가로 보이고 일반 상품으로 담는다", async ({ page }) => {
  // 담기는 로그인해야 한다(#542)
  await signInWithPets(page);
  const sent: string[] = [];
  await page.route("**/api/v1/carts/items", (route) => {
    sent.push(route.request().postData() ?? "");
    return route.fulfill({ status: 201, body: "" });
  });
  await page.goto("/products/101");

  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await page.getByRole("button", { name: "32,000원 장바구니 담기" }).click();

  await expect(page.getByText("상품이 장바구니에 담겼어요")).toBeVisible();
  expect(JSON.parse(sent[0])).toMatchObject({ itemType: "NORMAL", itemId: 101 });
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

// 최근 본 상품은 백엔드 API가 없어 이 브라우저에 기록한다(#509). 상세에 들어온 것이 좋아요의
// "최근에 봤어요"까지 이어지는지, 카드 값이 상품 조회에서 오는지 본다
test("상품 상세에 들어오면 좋아요의 최근에 봤어요에 남고, X로 빼면 비워진다", async ({ page }) => {
  // 좋아요는 로그인해야 열린다(#542)
  await signInWithPets(page);
  await page.goto(PATH);
  await expect(page.getByRole("heading", { name: NAME, level: 1 })).toBeVisible();
  // 기록은 하이드레이션 뒤 효과에서 한다. 저장된 뒤에 떠나야 흔들리지 않는다
  await page.waitForFunction(() =>
    (localStorage.getItem("gollaju.recentlyViewed") ?? "").includes('"productIds":[1]'),
  );

  await page.goto("/likes?tab=recent");

  const card = page.getByRole("listitem").filter({ hasText: NAME });
  await expect(card).toBeVisible();
  await expect(card.getByText("18,000원")).toBeVisible();
  await expect(card.getByText("25%")).toBeVisible();

  await card.getByRole("button", { name: `${NAME} 최근 본 목록에서 빼기` }).click();
  await expect(page.getByText("최근 본 상품이 없어요")).toBeVisible();
});
