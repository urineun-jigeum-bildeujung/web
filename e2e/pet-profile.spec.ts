// 아이 관리: 서버에서 받은 아이가 화면에 그대로 닿는지 본다.
import { expect, test } from "@playwright/test";

import { stubPetCatalog } from "./fixtures/pet-catalog";

// 목록·상세·건강 선택지 셋을 받는다(#230). 백엔드가 떠 있느냐에 흔들리지 않게 세운다
test.beforeEach(async ({ page }) => {
  await stubPetCatalog(page);
});

test("고른 아이의 품종·나이·성별과 몸무게를 보인다", async ({ page }) => {
  await page.goto("/mypage/pets");

  await expect(page.getByText("말티즈 · 4세 · 여자아이")).toBeVisible();
  await expect(page.getByText("4kg")).toBeVisible();
  await expect(page.getByText("보통")).toBeVisible();
});

// 상세가 코드만 준다. 백엔드가 displayName을 실어 줄 때까지 받은 값을 그대로 보인다
test("알레르기를 받은 코드 그대로 보인다", async ({ page }) => {
  await page.goto("/mypage/pets");

  await expect(page.getByText("CHICKEN")).toBeVisible();
});

// 목록에 ORDER BY가 없어 순서가 DB에 달렸다. 기본 아이가 처음 고른 아이여야 한다
test("기본 아이가 처음 고른 아이다", async ({ page }) => {
  await page.goto("/mypage/pets");

  const [first] = await page.getByRole("radio").all();
  await expect(first).toHaveAttribute("aria-checked", "true");
  await expect(first).toHaveAccessibleName("코코");
});
