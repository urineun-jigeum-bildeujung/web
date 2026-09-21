// 타임딜: 탭이 주소에 남는지, 목록에서 바로 담기는지 본다.
//
// 목록은 서버(product-service)가 조회한다(#282). Next 서버 프로세스가 보내는 요청은
// 브라우저 page.route()로 못 가로채, `playwright.server-fetch.config.ts`가 이 스펙 전용
// 목 API 서버(`mock-api-server.mjs`)와 전용 포트의 Next 서버를 따로 띄운다.
import { expect, test } from "@playwright/test";

import { stubAddToCart } from "./fixtures/cart";

test("탭을 옮기면 주소에 남고 뒤로가기로 돌아온다", async ({ page }) => {
  await page.goto("/deals");
  await expect(page.getByText("종료까지 남은 시간")).toBeVisible();

  await page.getByRole("tab", { name: "오픈 예정" }).click();
  await expect(page).toHaveURL(/tab=upcoming/);
  await expect(page.getByRole("button", { name: "오픈 알림 신청하기" })).toBeVisible();

  await page.goBack();
  await expect(page.getByText("종료까지 남은 시간")).toBeVisible();
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
