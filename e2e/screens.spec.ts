// 만들어 둔 화면을 모두 열어 콘솔 오류와 가로 스크롤을 확인한다.
// 눈으로 훑을 때 놓치는 종류(하이드레이션 오류, 화면 폭 넘침)를 기계가 잡게 한다.
//
// `/deals`·`/`(카테고리 탭)는 서버에서 실제 API를 조회해(#282, #289) 이 스위트의 dev
// 서버로는 확인할 수 없다 — 같은 스모크를 각각 `e2e/deals.server-fetch.spec.ts`·
// `e2e/home.server-fetch.spec.ts`로 옮겼다. "전체" 탭(`/`)은 카테고리 그리드를 안 그려
// 그대로 남긴다 — 타임딜 미리보기만 서버 조회인데, ROUTES 스모크는 API_BASE_URL_INTERNAL
// 없이 도는 dev 서버라 "전체" 탭도 이 스위트로는 확인할 수 없어 함께 옮긴다.
import { expect, test } from "@playwright/test";

import { stubPetCatalog } from "./fixtures/pet-catalog";
import { stubMemberProfile } from "./fixtures/member-profile";
import { stubPhoneVerification } from "./fixtures/phone-verification";
import { stubReviewApi } from "./fixtures/review";
import { stubNotifications } from "./fixtures/notifications";
import { stubCart } from "./fixtures/cart";
import { stubOrders } from "./fixtures/orders";
import { stubRecommendations } from "./fixtures/recommendations";
import { signIn } from "./fixtures/session";

/**
 * 화면이 바깥에 기대는 것을 끊는다.
 *
 * 스모크는 "화면이 그려지는가"만 보는 것이라 백엔드와 토스 서버 상태에 흔들리면 안 된다.
 *
 * 장바구니는 `GET /carts`를 부르는데 백엔드 주소가 비어 있어 같은 오리진으로 가고,
 * 그 자리에 아무것도 없어 404가 콘솔에 찍힌다. 빈 장바구니를 돌려줘 화면만 보게 한다.
 *
 * 좋아요도 같은 까닭으로 `GET /members/me/wishlist`를 막는다 — 찜은 브라우저가
 * 직접 부르는 클라이언트 조회라(#390) `page.route()`로 가로챌 수 있다. 서버가 조회하는
 * `/deals`·`/`(카테고리 탭)와 달리 별도 서버 조회 스위트로 옮길 필요가 없다.
 *
 * 토스 결제위젯은 키가 있는 환경에서만 바깥으로 요청을 내보낸다. 막지 않으면 키를 넣어 둔
 * 로컬에서만 `networkidle`에 닿지 못해 같은 테스트가 CI와 다르게 돈다.
 */
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/carts", (route) =>
    route.fulfill({ json: { memberId: 1, items: [], totalAmount: 0 } }),
  );
  await page.route("**/api/v1/members/me/wishlist**", (route) => route.fulfill({ json: [] }));
  // 끊지 않고 빈 스크립트로 답한다. 끊으면 `net::ERR_FAILED`가 콘솔에 남아 이 테스트가 잡는다.
  // 위젯은 어느 쪽이든 못 떠서 "결제 수단을 불러오지 못했어요"로 내려앉는다
  await page.route("**/*.tosspayments.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
});

/** 홈에 걸어 둔 화면 목록과 같은 순서다 */
const ROUTES = [
  "/dev/screens",
  "/onboarding",
  "/onboarding?step=basic",
  "/onboarding?step=detail",
  "/onboarding?step=breed",
  "/onboarding?step=health",
  "/onboarding?step=done",
  "/mypage",
  "/mypage/info",
  "/mypage/info/nickname",
  "/mypage/info/phone",
  "/mypage/address",
  "/mypage/address/new",
  "/mypage/address/search",
  "/mypage/pets",
  "/mypage/pets?tab=products",
  "/mypage/pets/basic?petId=3",
  "/mypage/pets/body?petId=3",
  "/mypage/pets/health?petId=3",
  "/mypage/pets/basic?petId=3&picking=breed",
  "/mypage/restock",
  "/mypage/recently-viewed",
  "/mypage/reviews",
  "/mypage/reviews/write?productId=0",
  "/mypage/reviews/1",
  "/mypage/orders",
  "/mypage/orders?tab=claims",
  "/mypage/orders/1",
  "/mypage/orders/1/claim?type=cancel",
  "/mypage/orders/1/claim?type=return",
  "/mypage/support",
  "/mypage/support/inquiries",
  "/mypage/support/notices",
  "/mypage/service",
  "/mypage/service/terms",
  "/mypage/service/privacy",
  "/mypage/settings",
  "/mypage/notifications",
  "/login",
  "/signup",
  "/likes",
  "/search",
  "/recommendations",
  "/compare",
  // **`/products/1`은 `/deals`와 같은 이유로 뺐다.** 상품 상세가 서버에서 실제 API를
  // 조회하는데(#413) 이 스위트에는 그 서버가 없어 404가 된다. 스모크는
  // `e2e/product-detail.server-fetch.spec.ts`가 전용 목 API 서버로 맡는다.
  // 사진 격자는 아직 목데이터라 서버 조회가 없어 여기 남는다
  "/products/1/photos",
  "/cart",
  "/payment",
  "/payment/address",
  "/payment/done",
  "/dev",
];

// 품종·건강 옵션이 서버에서 온다(#226). 백엔드가 떠 있느냐에 흔들리지 않게 세운다
test.beforeEach(async ({ page }) => {
  await stubPetCatalog(page);
  // 마이페이지는 세션이 없으면 로그인으로 보낸다(#447)
  await signIn(page);
  await stubPhoneVerification(page);
  await stubOrders(page);
  // 세우지 않으면 /cart가 빈 화면으로 서서 스모크가 아무것도 보지 않는다 (#379)
  await stubCart(page);
  await stubMemberProfile(page);
  // 리뷰 작성이 상품 요약을 받는다(#291)
  await stubReviewApi(page);
  // 알림함이 목록을 받는다(#354)
  await stubNotifications(page);
  // 맞춤 추천이 추천 API를 부른다(#600). 세우지 않으면 404를 오류 경계가 받으며 콘솔에 남는다
  await stubRecommendations(page);
});

// 시안이 모바일 393×852라 그 폭에서 확인한다
test.use({ viewport: { width: 393, height: 852 } });

for (const route of ROUTES) {
  test(`${route} — 오류 없이 그려진다`, async ({ page }) => {
    // **기본 30초로는 모자란다.** Next dev가 라우트를 그때그때 컴파일하는데, 느린 러너에서
    // 첫 컴파일만으로 30초에 가까워진다. 30초는 앱에 대해 아무것도 재지 않고 컴파일 대기를
    // 잴 뿐이다. 아래 "화면에 걸린 링크가 모두 열린다"가 같은 사정으로 이미 180초를 쓴다.
    //
    // **이 시간을 늘린 것으로 #324가 고쳐지지는 않았다.** 되풀이 실패의 원인은 컴파일 대기가
    // 아니라 끝나지 않는 `/_next/image` 요청이었고(아래 "결제수단 로고" 테스트), 90초로도
    // 넘겼다. 시간 자체는 그대로 둘 값이라 남긴다 (#324).
    test.setTimeout(90_000);

    const errors: string[] = [];
    // dev 오버레이가 세는 것과 같은 종류를 모은다
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(`예외: ${error.message}`));

    await page.goto(route, { waitUntil: "networkidle" });

    expect(errors, `콘솔 오류\n${errors.join("\n")}`).toEqual([]);

    // 가로로 넘치면 화면 폭 제한이 빠진 것이다
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
  });
}

// **로고가 이미지 최적화를 거치면 안 된다.**
//
// 83×16짜리 6KB PNG인데 `next/image`가 `/_next/image?url=…&w=96&q=75`로 한 번 더 왕복한다.
// CI에서 그 요청이 **끝나지 않아** 이 화면이 `networkidle`에 걸렸고, 같은 커밋을 재실행하면
// 통과해 한동안 원인을 못 찾았다. 실패한 회차의 Playwright 트레이스에 응답 없는 요청이
// 정확히 그것 하나였다 (#324).
//
// 최적화를 다시 켜면 여기서 걸린다.
test("주문 상세의 결제수단 로고는 이미지 최적화를 거치지 않는다", async ({ page }) => {
  const optimized: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/_next/image")) optimized.push(request.url());
  });

  await page.goto("/mypage/orders/1", { waitUntil: "networkidle" });

  await expect(page.getByAltText("토스페이")).toBeVisible();
  expect(optimized, `최적화를 거친 이미지 ${optimized.join(" ")}`).toEqual([]);
});

// **위 루프는 이것을 못 잡는다.** 조회가 실패해도 화면이 오류를 직접 그리므로 콘솔이 깨끗하다.
// 배송지는 `stubMemberProfile`이 세우는데, 이 파일에도 같은 경로의 스텁이 옛 응답 모양
// (`{ addresses: [...] }`)으로 남아 있었다. **Playwright는 나중에 건 route가 이겨서**
// 그것은 한 번도 쓰이지 않았고, 그래서 아무도 알아채지 못했다. 지우고 여기서 값을 겨눈다 (#329)
for (const route of ["/payment/address", "/mypage/address"]) {
  test(`${route} — 저장해 둔 배송지가 줄로 그려진다`, async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(route, { waitUntil: "networkidle" });

    // `stubMemberProfile`이 돌려주는 한 건이다. 결제의 목록은 줄 링크 옆에 "집 수정"이 따로 선다 (#595)
    await expect(page.getByRole("link", { name: /집/ }).first()).toBeVisible();
    await expect(page.getByText("서울특별시 강남구 테헤란로 123 UI타워 4층")).toBeVisible();
  });
}

/** 바텀시트·확인창을 여는 화면. 오버레이는 열어봐야만 보인다 */
const OVERLAYS = [
  {
    // 구매확정은 목록에서 주문 상세 맨 아래로 옮겼다(#462). 상세 스텁의 기본값이 배송완료다
    route: "/mypage/orders/1",
    open: /^구매확정$/,
    slot: "drawer-overlay",
    name: "주문 구매확정 바텀시트",
  },
  {
    route: "/mypage/orders/1",
    open: /^반품·교환$/,
    slot: "drawer-overlay",
    name: "반품·교환 고르기 바텀시트",
  },
  {
    // 온보딩 이탈 확인창이 사라져(#115) 확인창은 여기서 본다. 주문 취소는 목록에서 주문 상세
    // 맨 아래로 옮겼고(#410) 배송 전 주문에만 서서, 그 상태의 상세를 세운다
    route: "/mypage/orders/1",
    open: /^주문 취소하기$/,
    slot: "alert-dialog-overlay",
    name: "주문 취소 확인창",
    detail: { orderStatus: "PAID" },
  },
];

for (const { route, open, slot, name, detail } of OVERLAYS) {
  test(`${name} — 뒤 배경이 충분히 덮인다`, async ({ page }) => {
    // 나중에 건 route가 이겨서 beforeEach의 기본 주문 위에 덮인다
    if (detail) await stubOrders(page, { detail });
    await page.goto(route, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: open }).first().click();

    const overlay = page.locator(`[data-slot=${slot}]`);
    await expect(overlay).toBeVisible();

    // 뒤 배경은 흐려도 되지만 충분히 어두워야 한다.
    // 옅은 오버레이에 blur만 걸리면 글씨가 깨져 보인다.
    const alpha = await overlay.evaluate((el) => {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+(?=\s*\)$)/);
      return m ? Number(m[0]) : 1;
    });
    expect(alpha, "오버레이가 너무 옅다").toBeGreaterThanOrEqual(0.4);
  });
}

/** 화면에 걸린 링크가 실제로 열리는지 본다. 메뉴는 눌러보기 전에는 404를 모른다 */
test("화면에 걸린 링크가 모두 열린다", async ({ page }) => {
  // 화면을 모두 돌며 링크를 확인한다. dev 서버가 라우트를 그때그때 컴파일해 오래 걸린다.
  test.setTimeout(180_000);

  const visited = new Set<string>();
  const broken: string[] = [];

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "networkidle" });
    const hrefs = await page
      .locator("a[href^='/']")
      .evaluateAll((list) => list.map((a) => a.getAttribute("href")!));

    for (const href of hrefs) {
      const key = href.split("#")[0];
      if (visited.has(key)) continue;
      visited.add(key);

      // `/api/`로 시작하는 것은 Next 라우트가 아니라 게이트웨이가 받는 백엔드 주소다.
      // 소셜 로그인 시작 주소가 그렇다. 백엔드 없이 여는 이 테스트로는 판단할 수 없다
      if (key.startsWith("/api/")) continue;

      // **`/deals`는 ROUTES에서 뺀 것과 같은 이유로 여기서도 건너뛴다.** 서버에서 실제 API를
      // 조회하는데(#282) 이 스위트에는 그 서버가 없어, 요청할 때마다 Next 서버가 오류를 던진다.
      // 그 오류 처리가 dev 서버를 붙들어 같은 회차의 다른 테스트까지 느려졌다 (#324).
      // 이 라우트의 스모크는 `e2e/deals.server-fetch.spec.ts`가 전용 목 API 서버로 맡는다
      if (key === "/deals") continue;

      // 상품 상세도 같다(#413). 사진 격자(`/products/1/photos`)는 목데이터라 그대로 확인한다
      if (/^\/products\/[^/]+$/.test(key)) continue;

      // dev 서버는 라우트를 첫 요청에 컴파일한다. 다른 테스트와 겹치면
      // 그 사이에 실패할 수 있어 한 번 더 확인하고 판단한다.
      let status = (await page.request.get(key)).status();
      if (status >= 400) status = (await page.request.get(key)).status();
      if (status >= 400) broken.push(`${key} (${status}) ← ${route}`);
    }
  }

  expect(broken, `열리지 않는 링크\n${broken.join("\n")}`).toEqual([]);
});

/* 넓은 화면에서만 드러나는 것들. 모바일 폭에서는 화면과 시트 폭이 같아 가려진다 */
test.describe("넓은 화면", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  for (const { route, open, slot, name, detail } of OVERLAYS) {
    test(`${name} — 열어도 뒤 화면이 짜부라지지 않는다`, async ({ page }) => {
      if (detail) await stubOrders(page, { detail });
      await page.goto(route, { waitUntil: "networkidle" });
      const before = await page.evaluate(() =>
        Math.round(document.querySelector("main")!.getBoundingClientRect().width),
      );

      await page.getByRole("button", { name: open }).first().click();
      await expect(page.locator(`[data-slot=${slot}]`)).toBeVisible();

      // 포털이 body 폭 계산에 끼어들면 뒤 화면이 한 줄로 접힌다
      const after = await page.evaluate(() =>
        Math.round(document.querySelector("main")!.getBoundingClientRect().width),
      );
      expect(after, "시트를 여니 뒤 화면 폭이 달라졌다").toBe(before);
    });
  }

  // 시트가 앱 기둥(`layout.tsx`의 max-w-105 = 420px)을 벗어나 넓은 화면 전체로 퍼지지
  // 않는지 본다. 그전에는 결제수단 화면의 시트로 쟀는데 그 화면을 지워(#348) 구매확정
  // 시트로 옮겼다. 그 시트는 주문 목록에서 주문 상세로 옮겨 왔다 (#462).
  //
  // **두 시트는 모양이 다르다.** `shared/ui/bottom-sheet`의 `full`은 기둥을 꽉 채우고
  // (지운 화면이 그것), 기본값 `floating`은 양옆 8px을 띄운 카드다(mypa_061_구매확정).
  // 그래서 여기서 맞는 값은 기둥 폭이 아니라 기둥에서 16px을 뺀 값이다.
  const FLOATING_INSET_X = 8;

  test("바텀시트가 앱 기둥을 벗어나지 않는다", async ({ page }) => {
    await page.goto("/mypage/orders/1", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "구매확정", exact: true }).click();

    const sheet = page.locator("[data-slot=drawer-content]");
    await expect(sheet).toBeVisible();

    const sheetWidth = await sheet.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const screenWidth = await page.evaluate(() =>
      Math.round(document.querySelector("main")!.getBoundingClientRect().width),
    );
    expect(sheetWidth).toBe(screenWidth - FLOATING_INSET_X * 2);
  });
});

// 화면을 오갈 때 입력하던 값이 남는지 본다. 별도 라우트로 나가면 언마운트로 날아간다.
test("품종을 고르고 돌아와도 입력하던 값이 남는다", async ({ page }) => {
  await page.goto("/mypage/pets/basic?petId=3", { waitUntil: "networkidle" });

  const name = page.getByRole("textbox", { name: "아이의 이름을 알려주세요" });
  await name.fill("보리");

  await page.getByRole("button", { name: /품종 고르기/ }).click();
  // 줄을 누르면 바로 확정된다(시안 onbo_011)
  await page.getByRole("button", { name: "코리안 숏헤어", exact: true }).click();

  await expect(page.getByRole("button", { name: /코리안 숏헤어/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "아이의 이름을 알려주세요" })).toHaveValue("보리");
});

// 상단 뒤로가기가 화면을 벗어나면 안 된다. nuqs가 쿼리를 replace로 넣어 router.back()이 이 화면을 지나친다.
test("품종 단계의 상단 뒤로가기는 정보 수정으로 돌아온다", async ({ page }) => {
  await page.goto("/mypage/pets", { waitUntil: "networkidle" });
  await page.goto("/mypage/pets/basic?petId=3", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /품종 고르기/ }).click();
  await expect(page.getByRole("heading", { name: "품종선택" })).toBeVisible();

  await page.getByRole("button", { name: "이전 화면으로" }).click();
  await expect(page.getByRole("textbox", { name: "아이의 이름을 알려주세요" })).toBeVisible();
});

// 문자 발송은 양쪽 다 붙이지 않았다. 인증을 누르면 서버에 알리고 고정 번호가 채워진다(#85, #247).
// **콘솔도 함께 본다.** 위 ROUTES 루프는 화면을 열기만 해서, 값이 바뀔 때 나는 것을 못 잡는다.
// 통신사 Select가 비제어로 떠 있다가 고르는 순간 제어로 바뀌던 것이 그랬다 (#336).
//
// **`error`만 보면 놓친다.** Radix는 그 경고를 `console.warn`으로 낸다 — 실측으로 확인했다.
// 이 화면에서 나오는 것은 React DevTools 안내(`info`)와 HMR 연결(`log`)뿐이라 둘 다 본다.
test("휴대폰 인증을 누르면 인증번호가 채워진다", async ({ page }) => {
  const complaints: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      complaints.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto("/mypage/info/phone", { waitUntil: "networkidle" });

  await page.getByLabel("통신사").click();
  await page.getByRole("option", { name: "KT", exact: true }).click();
  await page.getByLabel("휴대폰 번호").fill("010-1234-5678");
  await page.getByRole("button", { name: "인증 번호 받기" }).click();

  await expect(page.getByRole("textbox", { name: "인증 번호", exact: true })).not.toHaveValue("");

  await page.getByRole("button", { name: "인증 번호 확인" }).click();
  await expect(page.getByRole("button", { name: "입력 완료" })).toBeEnabled();

  expect(complaints, `콘솔 경고·오류 ${complaints.join(" | ")}`).toEqual([]);
});

// 다섯 단계를 담아 세로로 길다. 낮은 화면에서 잘리면 마지막 단계를 못 읽는다(#87).
// 시안 메모대로 다이얼로그에서 액션시트로 옮겼고(#109), 잘림 문제는 그대로 봐야 한다.
test("낮은 화면에서도 체형 안내를 끝까지 읽을 수 있다", async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 300 });
  await page.goto("/onboarding?step=detail", { waitUntil: "networkidle" });

  await page.getByText("소형", { exact: false }).first().click();
  await page.getByRole("button", { name: "체형이 무엇인지 보기" }).click();

  const sheet = page.locator("[data-slot=drawer-content]");
  const box = await sheet.boundingBox();
  expect(box!.y, "시트가 화면 위로 잘렸다").toBeGreaterThanOrEqual(0);

  const last = page.getByText("살집 때문에 뼈가 안 만져지고 배가 나왔어요");
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
});

/*
 * 시안이 없는 화면은 넓은 폭에서도 420px 기둥 안에 있어야 한다(#491).
 *
 * 기둥이 빠지면 시안 없는 화면이 데스크톱에서 혼자 퍼진다. 넘침 검사로는 안 잡힌다 —
 * 퍼져도 가로로 넘치지는 않기 때문이다. `/cart`는 위 beforeEach의 세션·장바구니 스텁을 쓴다.
 *
 * **전수로 돌지는 않되 상품 영역의 제약 화면은 모두 본다(#634).** 시안이 오는 화면을 하나씩
 * 그룹 밖으로 꺼내는 중이라(홈·상품 상세·검색이 이미 나갔다), 꺼낼 때 폭 처리를 빠뜨리면 그
 * 화면이 넓은 뷰포트에서 혼자 퍼진다. 반대 방향(그룹 밖 화면이 뷰포트 폭을 쓰는지)은
 * `responsive.server-fetch.spec.ts`가 본다.
 *
 * **`/deals`는 여기 없다.** 서버 컴포넌트가 직접 목록을 조회해 이 스위트의 dev 서버로는 못
 * 그린다(파일 맨 위 주석) — 같은 검사를 `deals.server-fetch.spec.ts`가 맡는다.
 */
test.describe("태블릿 폭에서도 좁은 기둥을 지킨다", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  for (const route of [
    "/login",
    "/cart",
    "/likes",
    "/compare",
    "/recommendations",
    "/products/1/photos",
  ]) {
    test(`${route} — 420px 기둥 안에 가운데로 있다`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      // `(constrained)/layout.tsx`가 세우는 기둥 자체를 잰다. 뜻 없는 레이아웃 래퍼라
      // role·label 대신 접근성 트리에 들어가지 않는 테스트 식별자로 집는다 (PR #592 리뷰)
      const column = page.getByTestId("constrained-layout");
      await expect(column).toBeVisible();

      const box = await column.boundingBox();
      expect(box, "constrained 레이아웃의 크기를 재지 못했다").not.toBeNull();

      // 스크롤바가 있으면 뷰포트 폭과 다르므로 문서 쪽에서 받는다
      const viewport = await page.evaluate(() => document.documentElement.clientWidth);

      expect(Math.round(box!.width), "기둥이 풀려 화면이 퍼졌다").toBeLessThanOrEqual(420);
      expect(Math.round(box!.x), "가운데 정렬이 아니다").toBe(
        Math.round((viewport - box!.width) / 2),
      );
    });
  }
});

/*
 * 다크 모드가 실제로 어두운 값을 쓰는지 본다(#136, #565, #634).
 *
 * **색 값을 그대로 단정하지 않는다.** 토큰을 손볼 때마다 테스트가 깨지면 아무도 고치지 않는다.
 * 대신 라이트와 다크를 같은 화면에서 재고 **밝기가 뒤집히는 것**을 본다 — 배경은 어두워지고
 * 글자는 밝아져야 한다. 다크 값이 라이트에 멈추면 두 값이 같아져 여기서 잡힌다.
 *
 * 테마는 `html`의 `dark` 클래스로 켜고 기기에 남는다(next-themes, `attribute="class"`).
 * 시스템 설정은 따르지 않으므로(`enableSystem={false}`) `emulateMedia`로는 켤 수 없다 —
 * 저장된 값을 미리 넣어 둔다.
 */
/** 0(검정)~255(흰색). 토큰이 `lab()`으로도 와서 계산된 rgb를 캔버스 없이 재려고 직접 푼다 */
function brightness(color: string) {
  const nums = color.match(/[\d.]+/g)?.map(Number) ?? [];
  if (color.startsWith("rgb")) {
    const [r, g, b] = nums;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  // `lab(L% a b)`의 L이 0~100 밝기다. 255 기준으로 맞춘다
  return (nums[0] ?? 0) * 2.55;
}

async function readTheme(page: import("@playwright/test").Page, route: string, theme: string) {
  await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  // next-themes가 하이드레이션 뒤 클래스를 붙인다. 그 전에 재면 라이트 값이 잡힌다
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(theme === "dark");

  return page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { background: style.backgroundColor, color: style.color };
  });
}

// 상품 영역에서 서버 조회 없이 그려지는 화면들. `/`·`/products/:id`는 서버 조회라 이 스위트에 없다
for (const route of ["/search", "/likes", "/products/1/photos"]) {
  test(`${route} — 다크 모드가 라이트보다 어둡게 그려진다`, async ({ page }) => {
    const light = await readTheme(page, route, "light");
    const dark = await readTheme(page, route, "dark");

    // 이것이 이 검사가 막는 회귀다 — 다크 값이 라이트에 멈추면 두 값이 같아진다
    expect(dark.background, "다크 배경이 라이트와 같다").not.toBe(light.background);
    expect(dark.color, "다크 글자색이 라이트와 같다").not.toBe(light.color);

    expect(brightness(dark.background), "다크 배경이 더 밝다").toBeLessThan(
      brightness(light.background),
    );
    expect(brightness(dark.color), "다크 글자색이 더 어둡다").toBeGreaterThan(
      brightness(light.color),
    );
  });
}
