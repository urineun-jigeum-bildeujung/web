// 장바구니. 담아 둔 것을 고르고 수량을 바꾸고 결제로 넘어가는 길을 본다.
//
// **시연의 첫 단계다.** 그런데 그전에는 장바구니 조회를 세우지 않아 화면 목록에 `/cart`가
// 있어도 빈 상태나 오류가 통과했고, 고르고 넘어가는 길을 한 번도 지나지 않았다 (#379).
//
// 무엇을 그리는지는 단위 테스트(`cart-view.test.tsx`)가 본다.

import { expect, test } from "@playwright/test";

import { stubCart } from "./fixtures/cart";
import { signIn } from "./fixtures/session";

// 이 화면은 로그인해야 열린다. 세션이 없으면 로그인으로 보낸다(#542)
test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("고른 줄만 결제로 넘긴다", async ({ page }) => {
  await stubCart(page);
  await page.goto("/cart");

  await expect(page.getByText("테스트 사료")).toBeVisible();

  // 고르기 전에는 넘어갈 수 없다
  await expect(page.getByRole("button", { name: "결제하기" })).toBeDisabled();

  await page.getByRole("checkbox", { name: "테스트 사료 고르기" }).check();

  // **고른 줄만 실린다.** 빠뜨리면 결제 화면이 장바구니 전체를 세어 고르지 않은 것까지
  // 주문된다 (#255)
  const pay = page.getByRole("link", { name: "결제하기" });
  await expect(pay).toHaveAttribute("href", "/payment?items=NORMAL:1");
});

/**
 * **못 사는 줄은 고를 수 없다.**
 *
 * 전체선택의 분모에서도 빠져야 한다. 안 그러면 끝까지 골라도 `2/3`에서 멈춰 다 고른 것처럼
 * 보이지 않는다.
 */
test("못 사는 줄은 고를 수 없고 전체선택에서도 빠진다", async ({ page }) => {
  await stubCart(page);
  await page.goto("/cart");

  await expect(page.getByText("타임딜이 끝났어요")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "끝난 타임딜 상품 고르기" })).toBeDisabled();

  await page.getByRole("checkbox", { name: "전체선택" }).check();

  await expect(page.getByText("전체선택 (2/2)")).toBeVisible();
  // 화면 순서(최근에 담은 것부터)대로 싣는다. 결제 화면은 순서와 무관하게 받는다
  await expect(page.getByRole("link", { name: "결제하기" })).toHaveAttribute(
    "href",
    "/payment?items=NORMAL:2,NORMAL:1",
  );
});

// 서버는 먼저 담은 순서로 준다(sever#170). 흔히 쓰는 방식대로 최근에 담은 줄이 맨 위다 (#486)
test("최근에 담은 상품이 맨 위다", async ({ page }) => {
  await stubCart(page);
  await page.goto("/cart");

  const rows = page.getByRole("checkbox", { name: / 고르기$/ });
  await expect(rows.nth(0)).toHaveAccessibleName("끝난 타임딜 상품 고르기");
  await expect(rows.nth(1)).toHaveAccessibleName("테스트 간식 고르기");
  await expect(rows.nth(2)).toHaveAccessibleName("테스트 사료 고르기");
});

// 서버는 바뀐 값이 아니라 증감을 받는다. 절대값을 보내면 수량이 엉뚱하게 쌓인다
test("수량을 올리면 증감이 나간다", async ({ page }) => {
  const calls: string[] = [];
  await stubCart(page, { calls });
  await page.goto("/cart");

  await page.getByRole("button", { name: "테스트 사료 수량 하나 늘리기" }).click();

  await expect.poll(() => calls).toEqual(["PATCH /carts/items/NORMAL/1"]);
});

// 빼기는 되돌릴 수 없어 확인창으로 막는다
test("빼기는 확인창을 거쳐야 서버로 간다", async ({ page }) => {
  const calls: string[] = [];
  await stubCart(page, { calls });
  await page.goto("/cart");

  await page.getByRole("button", { name: "테스트 사료 빼기" }).click();
  await expect(page.getByText("장바구니에서 이 상품을 뺄까요?")).toBeVisible();
  expect(calls).toEqual([]);

  await page.getByRole("button", { name: "상품 빼기" }).click();

  await expect.poll(() => calls).toEqual(["DELETE /carts/items/NORMAL/1"]);
});

/**
 * **줄 어디를 눌러도 상세로 가고, 돌아와도 고른 줄이 그대로다** (QA No.9·No.23, #563).
 *
 * 이름이 아니라 가격 자리를 누른다 — 이름 링크가 줄 전체를 덮는지 본다. 고르기는 그 덮개에 가리지
 * 않고 눌려야 한다(가리면 `check()`가 "다른 요소가 가로챈다"로 실패한다).
 */
test("줄을 누르면 상품 상세로 가고, 돌아와도 고른 줄이 그대로다", async ({ page }) => {
  await stubCart(page);
  await page.goto("/cart");

  await page.getByRole("checkbox", { name: "테스트 사료 고르기" }).check();
  await expect(page.getByText("전체선택 (1/2)")).toBeVisible();

  // 가격 글자는 덮개 아래에 있어 `click()`은 "링크가 가로챈다"며 누르지 않는다. 그 자리를 마우스로 누른다
  const price = await page.getByText("9,345", { exact: true }).boundingBox();
  if (!price) throw new Error("가격 자리를 찾지 못했다");
  await page.mouse.click(price.x + price.width / 2, price.y + price.height / 2);
  // 링크 이동은 새 화면을 받아야 주소가 바뀐다. 개발 서버가 상세 경로를 처음 컴파일하면 5초를 넘긴다
  await expect(page).toHaveURL(/\/products\/1$/, { timeout: 30_000 });

  await page.goBack();
  await expect(page.getByText("전체선택 (1/2)")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "테스트 사료 고르기" })).toBeChecked();
});

// 앱을 완전히 끄고 다시 여는 것과 같다. 고른 것은 이 브라우저에 남는다 (QA No.24, #563)
test("탭을 닫고 새 탭에서 열어도 고른 줄이 그대로다", async ({ context, page }) => {
  await stubCart(page);
  await page.goto("/cart");
  await page.getByRole("checkbox", { name: "테스트 간식 고르기" }).check();
  await expect(page.getByText("전체선택 (1/2)")).toBeVisible();
  await page.close();

  // 로그인 스텁(`beforeEach`)은 탭마다 건다. 새 탭에도 다시 건다
  const next = await context.newPage();
  await signIn(next);
  await stubCart(next);
  await next.goto("/cart");

  await expect(next.getByRole("checkbox", { name: "테스트 간식 고르기" })).toBeChecked();
  await expect(next.getByRole("link", { name: "결제하기" })).toHaveAttribute(
    "href",
    "/payment?items=NORMAL:2",
  );
});
