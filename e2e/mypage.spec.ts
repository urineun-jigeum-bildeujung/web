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

  await expect(page).toHaveURL(/\/onboarding\?step=basic$/);
});

test("아이 원은 그대로 아이 관리로 간다", async ({ page }) => {
  await page.goto("/mypage");

  await expect(page.getByRole("link", { name: "반려동물 프로필 관리" })).toHaveAttribute(
    "href",
    "/mypage/pets",
  );
});

// 전에는 메인·상품 상세 뱃지가 늘 "5"였고 마이페이지는 뱃지가 없었다
test("헤더 장바구니 뱃지가 담은 가짓수를 보인다", async ({ page }) => {
  await page.goto("/mypage");

  // `stubCart`는 세 줄(못 사는 줄 하나 포함)을 담아 둔다
  await expect(page.getByRole("link", { name: "장바구니에 3개" })).toBeVisible();
});
