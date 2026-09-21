// 만들어 둔 화면을 모두 열어 콘솔 오류와 가로 스크롤을 확인한다.
// 눈으로 훑을 때 놓치는 종류(하이드레이션 오류, 화면 폭 넘침)를 기계가 잡게 한다.
//
// `/deals`는 서버에서 실제 API를 조회해(#282) 이 스위트의 dev 서버로는 확인할 수
// 없다 — 같은 스모크를 `e2e/deals.server-fetch.spec.ts`로 옮겼다.
import { expect, test } from "@playwright/test";

import { stubPetCatalog } from "./fixtures/pet-catalog";
import { stubMemberProfile } from "./fixtures/member-profile";
import { stubPhoneVerification } from "./fixtures/phone-verification";
import { stubReviewApi } from "./fixtures/review";
import { stubOrders } from "./fixtures/orders";

/**
 * 화면이 바깥에 기대는 것을 끊는다.
 *
 * 스모크는 "화면이 그려지는가"만 보는 것이라 백엔드와 토스 서버 상태에 흔들리면 안 된다.
 *
 * 장바구니는 `GET /carts`를 부르는데 백엔드 주소가 비어 있어 같은 오리진으로 가고,
 * 그 자리에 아무것도 없어 404가 콘솔에 찍힌다. 빈 장바구니를 돌려줘 화면만 보게 한다.
 *
 * 토스 결제위젯은 키가 있는 환경에서만 바깥으로 요청을 내보낸다. 막지 않으면 키를 넣어 둔
 * 로컬에서만 `networkidle`에 닿지 못해 같은 테스트가 CI와 다르게 돈다.
 */
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/carts", (route) =>
    route.fulfill({ json: { memberId: 1, items: [], totalAmount: 0 } }),
  );
  // 배송지 설정도 같은 이유다. 빈 목록을 주면 "등록된 배송지가 없어요"만 보이므로
  // 줄이 실제로 그려지는 것까지 보도록 한 건을 돌려준다 (#237)
  await page.route("**/api/v1/members/me/addresses", (route) =>
    route.fulfill({
      json: {
        addresses: [
          {
            addressId: 5,
            addressName: "집",
            receiver: "홍길동",
            phone: "010-1234-5678",
            zipCode: "06133",
            address: "서울특별시 강남구 테헤란로 123",
            addressDetail: "UI타워 4층 404호",
            deliveryNote: null,
            isDefault: true,
          },
        ],
      },
    }),
  );
  // 끊지 않고 빈 스크립트로 답한다. 끊으면 `net::ERR_FAILED`가 콘솔에 남아 이 테스트가 잡는다.
  // 위젯은 어느 쪽이든 못 떠서 "결제 수단을 불러오지 못했어요"로 내려앉는다
  await page.route("**/*.tosspayments.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
});

/** 홈에 걸어 둔 화면 목록과 같은 순서다 */
const ROUTES = [
  "/",
  "/?category=food",
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
  "/mypage/payment",
  "/mypage/orders",
  "/mypage/orders/1",
  "/mypage/orders/1/claim?type=cancel",
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
  "/mypage/pets?tab=products&reviewed=todo",
  "/compare",
  "/products/1",
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
  await stubPhoneVerification(page);
  await stubOrders(page);
  await stubMemberProfile(page);
  // 리뷰 작성이 상품 요약을 받는다(#291)
  await stubReviewApi(page);
});

// 시안이 모바일 393×852라 그 폭에서 확인한다
test.use({ viewport: { width: 393, height: 852 } });

for (const route of ROUTES) {
  test(`${route} — 오류 없이 그려진다`, async ({ page }) => {
    // **기본 30초로는 모자란다.** Next dev가 라우트를 그때그때 컴파일하는데, 워커 여럿이
    // 서로 다른 라우트를 동시에 치면 컴파일이 줄을 선다. 느린 러너에서는 자기 차례를
    // 기다리는 것만으로 30초를 넘겨, CI에서 되풀이 실패했다 — 같은 커밋을 재실행하면
    // 통과했다. 30초는 앱에 대해 아무것도 재지 않고 컴파일 대기를 잴 뿐이다.
    //
    // 아래 "화면에 걸린 링크가 모두 열린다"가 같은 사정으로 이미 180초를 쓴다 (#324).
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

/** 바텀시트·확인창을 여는 화면. 오버레이는 열어봐야만 보인다 */
const OVERLAYS = [
  {
    route: "/mypage/orders",
    open: /구매 확정/,
    slot: "drawer-overlay",
    name: "주문 구매확정 바텀시트",
  },
  {
    route: "/mypage/payment",
    open: /KB국민카드/,
    slot: "drawer-overlay",
    name: "결제수단 바텀시트",
  },
  {
    // 온보딩 이탈 확인창이 사라져(#115) 확인창은 여기서 본다
    route: "/mypage/orders",
    open: /^주문 취소$/,
    slot: "alert-dialog-overlay",
    name: "주문 취소 확인창",
  },
];

for (const { route, open, slot, name } of OVERLAYS) {
  test(`${name} — 뒤 배경이 충분히 덮인다`, async ({ page }) => {
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

  for (const { route, open, slot, name } of OVERLAYS) {
    test(`${name} — 열어도 뒤 화면이 짜부라지지 않는다`, async ({ page }) => {
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

  test("바텀시트가 화면 폭을 넘지 않는다", async ({ page }) => {
    await page.goto("/mypage/payment", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /KB국민카드/ }).click();

    const sheet = page.locator("[data-slot=drawer-content]");
    await expect(sheet).toBeVisible();

    const sheetWidth = await sheet.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    const screenWidth = await page.evaluate(() =>
      Math.round(document.querySelector("main")!.getBoundingClientRect().width),
    );
    expect(sheetWidth).toBe(screenWidth);
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
test("휴대폰 인증을 누르면 인증번호가 채워진다", async ({ page }) => {
  await page.goto("/mypage/info/phone", { waitUntil: "networkidle" });

  await page.getByLabel("통신사").click();
  await page.getByRole("option", { name: "KT", exact: true }).click();
  await page.getByLabel("휴대폰 번호").fill("010-1234-5678");
  await page.getByRole("button", { name: "인증 번호 받기" }).click();

  await expect(page.getByRole("textbox", { name: "인증 번호", exact: true })).not.toHaveValue("");

  await page.getByRole("button", { name: "인증 번호 확인" }).click();
  await expect(page.getByRole("button", { name: "입력 완료" })).toBeEnabled();
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
