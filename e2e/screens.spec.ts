// 만들어 둔 화면을 모두 열어 콘솔 오류와 가로 스크롤을 확인한다.
// 눈으로 훑을 때 놓치는 종류(하이드레이션 오류, 화면 폭 넘침)를 기계가 잡게 한다.
import { expect, test } from "@playwright/test";

/** 홈에 걸어 둔 화면 목록과 같은 순서다 */
const ROUTES = [
  "/",
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
  "/mypage/address/new",
  "/mypage/address/search",
  "/mypage/restock",
  "/mypage/reviews",
  "/mypage/payment",
  "/mypage/orders",
  "/mypage/support",
  "/mypage/settings",
  "/compare",
  "/compare/select",
  "/dev",
];

// 시안이 모바일 393×852라 그 폭에서 확인한다
test.use({ viewport: { width: 393, height: 852 } });

for (const route of ROUTES) {
  test(`${route} — 오류 없이 그려진다`, async ({ page }) => {
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
    route: "/onboarding?step=basic",
    open: /닫기|그만|나가/,
    slot: "alert-dialog-overlay",
    name: "온보딩 이탈 확인창",
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
