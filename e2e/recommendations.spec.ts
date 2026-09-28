// 맞춤 추천의 헤더와 아이 이름을 실제 브라우저로 본다.
// QA 1차 피드백(#470)에서 잡힌 것이다 — 헤더에 알림·장바구니가 없었고, 아이 이름이 예시(코코·봄이)라
// 마이페이지의 실제 이름과 달랐다.
import { expect, test } from "@playwright/test";

import { stubCart } from "./fixtures/cart";
import { stubNotifications } from "./fixtures/notifications";
import { stubPetCatalog } from "./fixtures/pet-catalog";
import { signIn } from "./fixtures/session";

test.beforeEach(async ({ page }) => {
  // 아이 목록은 로그인했을 때만 부른다
  await signIn(page);
  await stubPetCatalog(page);
  await stubNotifications(page);
  await stubCart(page);
});

test("헤더에 알림과 장바구니가 있다", async ({ page }) => {
  await page.goto("/recommendations");

  await expect(page.getByRole("link", { name: "알림" })).toHaveAttribute(
    "href",
    "/mypage/notifications",
  );
  await expect(page.getByRole("link", { name: "장바구니에 3개" })).toHaveAttribute("href", "/cart");
});

test("아이는 실제 목록에서 기본 아이부터 고르고, 바꾸면 적합도 문장도 따라간다", async ({
  page,
}) => {
  await page.goto("/recommendations");

  // 스텁의 기본 아이는 코코다
  const picker = page.getByRole("combobox", { name: "어느 아이의 추천을 볼지" });
  await expect(picker).toContainText("코코");
  await expect(page.getByText(/코코와 적합도 \d+점/).first()).toBeAttached();

  await picker.click();
  await page.getByRole("option", { name: "보리" }).click();

  await expect(page).toHaveURL(/pet=7/);
  await expect(page.getByText(/보리와 적합도 \d+점/).first()).toBeAttached();
});
