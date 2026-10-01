// 타임딜: 탭이 주소에 남는지, 목록에서 바로 담기는지 본다.
//
// 목록은 서버(product-service)가 조회한다(#282). Next 서버 프로세스가 보내는 요청은
// 브라우저 page.route()로 못 가로채, `playwright.server-fetch.config.ts`가 이 스펙 전용
// 목 API 서버(`mock-api-server.mjs`)와 전용 포트의 Next 서버를 따로 띄운다.
import { expect, test } from "@playwright/test";

import { stubAddToCart, stubCart } from "./fixtures/cart";
import { stubNotifications, stubTimeDealSubscription } from "./fixtures/notifications";
import { signIn } from "./fixtures/session";

// 이 화면은 로그인해야 열린다. 세션이 없으면 로그인으로 보낸다(#542).
// 로그인하면 헤더 장바구니와 알림 폴링이 서버를 부른다. 목 서버에 없어 404가 콘솔에 남지 않게 세운다
test.beforeEach(async ({ page }) => {
  await signIn(page);
  await stubCart(page);
  await stubNotifications(page);
  await stubTimeDealSubscription(page);
});

// 탭 전환은 이력에 쌓지 않는다. 장바구니에서 뒤로가면 보던 탭 그대로, 한 번 더 뒤로가면
// 타임딜에 오기 전 화면이다 (QA #1)
test("탭을 옮긴 뒤 장바구니에 갔다 뒤로가면 보던 탭으로, 한 번 더 뒤로가면 전 화면으로 간다", async ({
  page,
}) => {
  await page.goto("/search");
  await page.goto("/deals");
  await expect(page.getByText("종료까지 남은 시간")).toBeVisible();

  await page.getByRole("tab", { name: "오픈 예정" }).click();
  await expect(page).toHaveURL(/tab=upcoming/);
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();

  await page.getByRole("link", { name: "장바구니" }).click();
  await expect(page).toHaveURL(/\/cart$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/deals\?tab=upcoming$/);
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/search$/);
});

// 타임딜 헤더에만 알림이 없었다. 알림에 갔다 뒤로가면 보던 탭 그대로의 타임딜이다 (QA No.25, #588)
test("헤더 알림에 갔다 뒤로가면 보던 탭의 타임딜로 돌아온다", async ({ page }) => {
  await page.goto("/deals?tab=upcoming");
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();

  await page.getByRole("link", { name: "알림", exact: true }).click();
  // 알림 라우트를 처음 여는 순간이라 dev 서버가 그 자리에서 컴파일한다
  await expect(page).toHaveURL(/\/mypage\/notifications$/, { timeout: 30_000 });

  await page.goBack();
  await expect(page).toHaveURL(/\/deals\?tab=upcoming$/);
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();
});

// 화면 상태로만 "신청됨"을 그려 새로고침하면 사라졌다. 타임딜 알림 구독에 저장한다(#644)
test("오픈 알림을 신청하면 서버에 저장돼 새로고침해도 신청됨으로 남고, 다시 누르면 취소된다", async ({
  page,
}) => {
  // beforeEach의 스텁보다 나중에 건 route가 먼저 받는다
  const alarm = await stubTimeDealSubscription(page);
  await page.goto("/deals?tab=upcoming");

  await page.getByRole("button", { name: "오픈 알림 신청하기" }).click();
  await expect(page.getByRole("button", { name: "오픈 알림 신청 취소하기" })).toBeVisible();
  expect(alarm.puts).toEqual([{ subscribed: true }]);

  await page.reload();
  await expect(page.getByRole("button", { name: "오픈 알림 신청 취소하기" })).toBeVisible();

  await page.getByRole("button", { name: "오픈 알림 신청 취소하기" }).click();
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();
  expect(alarm.puts).toEqual([{ subscribed: true }, { subscribed: false }]);
});

// 오픈 예정 카드에 링크가 없어 눌러도 아무 일이 없었다 (QA #94)
test("오픈 예정 딜 상품을 누르면 상품 상세로 간다", async ({ page }) => {
  await page.goto("/deals?tab=upcoming");

  await page.getByRole("link", { name: /사슴고기&현미 소형견 사료 1.2kg/ }).click();

  // 상세 라우트를 처음 여는 순간이라 dev 서버가 그 자리에서 컴파일한다
  await expect(page).toHaveURL(/\/products\/201$/, { timeout: 30_000 });
});

test("목록에서 옵션을 골라 바로 담는다", async ({ page }) => {
  // 담기는 **브라우저가** 보낸다(목록과 달리 서버 컴포넌트가 아니다). page.route로 세운다 (#316)
  await stubAddToCart(page);
  await page.goto("/deals");

  await page.getByLabel("오리&고구마 소형견 사료 1.5kg 장바구니에 담기").click();
  await page.getByLabel("오리&고구마 소형견 사료 1.5kg 수량 하나 늘리기").click();
  await page.getByRole("button", { name: "48,000원 장바구니 담기" }).click();

  await expect(page.getByLabel("오리&고구마 소형견 사료 1.5kg 장바구니에서 빼기")).toBeVisible();
  await expect(page.getByText("장바구니에 담겼어요")).toBeVisible();
});

// 딜가는 일반 상품 상세에 오지 않는다. 링크가 딜 번호를 들고 가야 상세도 딜가다 (#484)
test("진행 중 딜 상품을 누르면 딜가가 붙은 상세로 간다", async ({ page }) => {
  await page.goto("/deals");

  await page.getByRole("link", { name: /오리&고구마 소형견 사료 1.5kg/ }).click();

  await expect(page).toHaveURL(/\/products\/101\?dealItem=1$/);
  const summary = page.getByRole("region", { name: "오리&고구마 소형견 사료 1.5kg" });
  await expect(summary.getByText("24,000원")).toBeVisible();
});

// `screens.spec.ts`의 ROUTES 스모크에서 옮겨왔다 — /deals는 서버 조회를 타서 그 스위트의
// dev 서버로는 확인할 수 없다. 같은 검사(콘솔 오류·가로 스크롤 없음)를 여기서 한다
test("/deals — 오류 없이 그려진다", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`예외: ${error.message}`));

  await page.goto("/deals", { waitUntil: "networkidle" });

  expect(errors, `콘솔 오류\n${errors.join("\n")}`).toEqual([]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
});
