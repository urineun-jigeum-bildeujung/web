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

  // 정렬을 바꾸면 주소에 남는다
  await page.getByLabel("정렬").click();
  await page.getByRole("option", { name: "낮은 가격순" }).click();
  await expect(page).toHaveURL(/category=food.*sort=price-low/);

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

// 느린 기기에서 첫 화면이 뜨자마자 종류를 누르고 곧바로 뒤로가면, 주소는 `/`인데 화면이 사료 탭 모양
// (정렬 + 전체용 빈 목록)에 멈췄다(#560). 느린 CI 러너에서 위 테스트가 계속 흔들린 원인이다.
// CPU를 3배 늦춰 그 경합을 매번 만든다 — 탭이 nuqs(shallow: false)로 주소를 먼저 바꾸던 코드에서는 매번 실패했다
test("느린 기기에서 첫 화면 직후 종류를 누르고 바로 뒤로가도 전체 탭으로 돌아온다", async ({
  page,
}) => {
  test.slow();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 3 });
  await page.goto("/");

  await page.getByRole("button", { name: "사료", exact: true }).click();
  await expect(page).toHaveURL(/category=food/, { timeout: 15_000 });
  await page.goBack();

  await expect(page.getByText(/AI가 골라주는/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "전체", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page).toHaveURL(/\/$/);
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

  // **이어 받은 카드도 서버가 준 정가·할인율을 그린다(#458, #632).** 둘째 쪽 상품만 할인 중이고,
  // 서버는 `6,700 / 33,900`을 `HALF_UP`으로 20%라 한다 — 화면이 버림으로 다시 계산하면 19%다
  const senior = page.getByRole("listitem").filter({ hasText: "노령견 저지방 소화케어 사료 1kg" });
  await expect(senior.getByText("20%")).toBeVisible();
  await expect(senior.getByText("33,900원")).toBeVisible();
  await expect(senior.getByText("19%")).toBeHidden();
});

// 칸(li)을 flex로 두고 카드에 flex-1을 주던 동안 카드의 최소 폭이 이름 전체 길이가 되어, 긴 이름의
// 카드가 옆 칸을 덮고 화면이 가로로 밀렸다. QA HM-009·HM-011 "디자인 레이아웃이 안 맞는 것 같아요" (#534)
test("종류 탭의 긴 상품명은 칸 안에서 말줄임되고 카드가 칸 폭을 넘지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/?category=food");

  const cell = page.getByRole("listitem").filter({ hasText: "담았냥 그레인프리" });
  await expect(cell).toBeVisible();
  const cellBox = await cell.boundingBox();
  const cardBox = await cell.getByRole("link").boundingBox();
  expect(cardBox!.width, "카드가 칸보다 넓다").toBeLessThanOrEqual(cellBox!.width + 0.5);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
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

/*
 * 배너 세 장이 실제로 뜨는지 본다(#636).
 *
 * **단위 테스트는 `alt`·`loading` 속성만 본다.** 그 둘은 자산이 없어도 그대로 붙어, 파일 이름이
 * 바뀌거나 지워지면 첫 화면 맨 위에 빈 배너 셋이 뜨는데도 통과했다. 배너는 PD가 갈아끼울
 * 정적 자산이라(#615) 파일을 바꾸는 손이 들어오는 자리다.
 *
 * `next/image`를 거치므로 원본이 없으면 `/_next/image` 요청이 실패해 `naturalWidth`가 0이다 —
 * 이 검사 하나로 자산 존재와 최적화 경로를 같이 지난다.
 *
 * **넉넉히 기다린다.** 차가운 서버에서 최적화가 끝나기 전에 테스트가 끝나면 그 요청이 끊기고,
 * 뒤에 오는 같은 주소 요청이 답을 받지 못해 E2E 잡이 통째로 시간 초과된 적이 있다(#535).
 */
test("프로모션 배너 세 장이 모두 로드된다", async ({ page }) => {
  await page.goto("/");

  const banners = page.getByRole("region", { name: "진행 중인 행사" }).locator("img");
  await expect(banners).toHaveCount(3);

  /** 그 자리의 이미지가 실제 픽셀을 가졌는지. 0이면 못 받은 것이다 */
  const loaded = (index: number) =>
    expect
      .poll(() => banners.nth(index).evaluate((img: HTMLImageElement) => img.naturalWidth), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

  // 첫 장만 먼저 받고 나머지는 볼 때 받는다(AGENTS 5.6) — 점을 눌러 옮긴 뒤에 재야 한다
  await loaded(0);

  await page.getByRole("button", { name: "2번 배너 보기" }).click();
  await loaded(1);

  await page.getByRole("button", { name: "3번 배너 보기" }).click();
  await loaded(2);
});
