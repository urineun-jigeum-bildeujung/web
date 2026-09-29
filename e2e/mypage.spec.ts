// 마이페이지 홈의 아이 원 줄과 헤더 장바구니를 실제 브라우저로 본다.
// QA 1차 피드백(#470)에서 잡힌 것이다 — 사진 없는 아이가 회색 원으로만 보였고, 점선 원을 누르면
// 첫 아이 프로필이 열렸고, 헤더 장바구니 뱃지가 담은 것과 상관없었다.
import { expect, test } from "@playwright/test";

import { stubCart } from "./fixtures/cart";
import { stubMemberProfile } from "./fixtures/member-profile";
import { stubNotifications } from "./fixtures/notifications";
import { stubPetCatalog } from "./fixtures/pet-catalog";
import { signIn } from "./fixtures/session";

test.beforeEach(async ({ page }) => {
  // 마이페이지는 세션이 없으면 로그인으로 보낸다(#447)
  await signIn(page);
  await stubPetCatalog(page);
  await stubMemberProfile(page);
  await stubNotifications(page);
  await stubCart(page);
});

test("사진 없는 아이 원에 이름 앞 두 글자가 보인다", async ({ page }) => {
  // 두 글자가 넘는 이름이어야 앞 두 글자만 남는지 드러난다. 나중에 건 route가 이긴다
  await page.route("**/members/me/pets", (route) =>
    route.fulfill({
      json: [
        { petId: 3, name: "구름이", image: null, isDefault: true },
        { petId: 7, name: "보리", image: null, isDefault: false },
      ],
    }),
  );

  await page.goto("/mypage");

  await expect(page.getByTitle("구름이")).toHaveText("구름");
  await expect(page.getByTitle("보리")).toHaveText("보리");
});

test("점선 원을 누르면 첫 아이 프로필이 아니라 새 아이 등록으로 간다", async ({ page }) => {
  await page.goto("/mypage");

  await page.getByRole("link", { name: "새 아이 추가" }).click();

  await expect(page).toHaveURL(/\/onboarding\?step=basic&from=\/mypage$/);
});

// 아이 추가 첫 단계의 "이전"이 눌리지 않았다(QA No.254, #527)
test("아이 추가 첫 단계의 이전을 누르면 마이페이지로 돌아간다", async ({ page }) => {
  await page.goto("/mypage");
  await page.getByRole("link", { name: "새 아이 추가" }).click();
  await expect(page.getByRole("heading", { name: "아이를 소개해 주세요" })).toBeVisible();

  await page.getByRole("button", { name: "이전" }).click();

  await expect(page).toHaveURL(/\/mypage$/);
});

// 줄 전체가 링크 하나라 어느 원을 눌러도 첫 아이 프로필이 열렸다(QA No.129·181, #527)
test("아이 원을 누르면 그 아이를 고른 아이 관리가 열린다", async ({ page }) => {
  await page.goto("/mypage");

  await page.getByRole("link", { name: "보리 프로필 관리" }).click();

  await expect(page).toHaveURL(/\/mypage\/pets\?pet=7$/);
  await expect(page.getByRole("radio", { name: "보리" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("코리안 숏헤어 · 2세 · 남자아이")).toBeVisible();
});

// 전에는 메인·상품 상세 뱃지가 늘 "5"였고 마이페이지는 뱃지가 없었다
test("헤더 장바구니 뱃지가 담은 가짓수를 보인다", async ({ page }) => {
  await page.goto("/mypage");

  // `stubCart`는 세 줄(못 사는 줄 하나 포함)을 담아 둔다
  await expect(page.getByRole("link", { name: "장바구니에 3개" })).toBeVisible();
});
