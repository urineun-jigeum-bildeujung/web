// 홈 카테고리 그리드: 탭을 옮기면 서버가 그 카테고리 상품을 조회해 주는지, 더 보기가
// 커서를 이어 받는지 본다.
//
// 목록은 서버(product-service)가 조회한다(#289). Next 서버 프로세스가 보내는 요청은
// 브라우저 page.route()로 못 가로채, `playwright.server-fetch.config.ts`가 이 스펙 전용
// 목 API 서버(`mock-api-server.mjs`)와 전용 포트의 Next 서버를 따로 띄운다.
import { expect, test } from "@playwright/test";

test("카테고리 탭을 옮기면 주소에 남고 서버가 그 카테고리 상품을 보여준다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "사료" }).click();
  await expect(page).toHaveURL(/category=food/);
  await expect(page.getByText("중소형견 소포장 사료 1kg")).toBeVisible();

  // 큐레이션 자리가 사라지고 정렬이 나온다
  await expect(page.getByText(/AI가 골라주는/)).toBeHidden();
  await expect(page.getByLabel("정렬")).toBeVisible();

  // 지금 어느 것을 보고 있는지 알린다
  await expect(page.getByRole("button", { name: "사료", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("종류를 고른 뒤 뒤로가기로 전체 탭에 돌아온다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "사료", exact: true }).click();
  await expect(page).toHaveURL(/category=food/);

  await page.goBack();
  // 전체 탭은 큐레이션이라 종류 목록과 구성이 다르다
  await expect(page.getByText(/AI가 골라주는/)).toBeVisible();
});

test("더 보기를 누르면 다음 페이지를 이어 붙이고, 다 받으면 버튼이 사라진다", async ({ page }) => {
  await page.goto("/?category=food");

  await expect(page.getByText("중소형견 소포장 사료 1kg")).toBeVisible();
  await expect(page.getByText("노령견 저지방 소화케어 사료 1kg")).not.toBeVisible();

  await page.getByRole("button", { name: "더 보기" }).click();

  // 첫 페이지 상품은 그대로 남고 다음 페이지가 이어 붙는다
  await expect(page.getByText("중소형견 소포장 사료 1kg")).toBeVisible();
  await expect(page.getByText("노령견 저지방 소화케어 사료 1kg")).toBeVisible();
  // 두 번째 페이지가 hasNext:false라 버튼이 사라진다
  await expect(page.getByRole("button", { name: "더 보기" })).not.toBeVisible();
});

// `screens.spec.ts`의 ROUTES 스모크에서 옮겨왔다 — `/`는 "전체" 탭에서 타임딜을
// 서버 조회해(#289) 그 스위트의 dev 서버로는 확인할 수 없다. 같은 검사(콘솔 오류·
// 가로 스크롤 없음)를 여기서 한다
test("/ — 오류 없이 그려진다", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`예외: ${error.message}`));

  await page.goto("/", { waitUntil: "networkidle" });

  expect(errors, `콘솔 오류\n${errors.join("\n")}`).toEqual([]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
});
