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

// 저장은 코드로 하지만 상세가 표시명을 함께 준다. 코드를 찍으면 사람이 읽지 못한다
test("알레르기를 표시명으로 보인다", async ({ page }) => {
  await page.goto("/mypage/pets");

  await expect(page.getByText("닭고기")).toBeVisible();
  await expect(page.getByText("CHICKEN")).toHaveCount(0);
});

// 목록에 ORDER BY가 없어 순서가 DB에 달렸다. 기본 아이가 처음 고른 아이여야 한다
test("기본 아이가 처음 고른 아이다", async ({ page }) => {
  await page.goto("/mypage/pets");

  // `.all()`은 그 순간의 결과를 그대로 준다. 목록이 아직 안 그려졌으면 빈 배열이라
  // 기다리지 않고 통과하거나 undefined로 터진다. `.first()`는 Locator라 붙을 때까지 기다린다
  const first = page.getByRole("radio").first();
  await expect(first).toHaveAccessibleName("코코");
  await expect(first).toHaveAttribute("aria-checked", "true");
});

// 아이를 바꾸면 그 아이의 상세를 다시 받아야 한다. 스텁이 한 아이만 돌려주던 동안에는
// 보리를 골라도 코코의 값이 그대로 남는 것을 잡지 못했다
test("다른 아이를 고르면 그 아이의 값으로 바뀐다", async ({ page }) => {
  await page.goto("/mypage/pets");
  await expect(page.getByText("말티즈 · 4세 · 여자아이")).toBeVisible();

  await page.getByRole("radio", { name: "보리" }).click();

  await expect(page.getByText("코리안 숏헤어 · 2세 · 남자아이")).toBeVisible();
  await expect(page.getByText("3.5kg")).toBeVisible();
  await expect(page.getByText("말티즈 · 4세 · 여자아이")).toHaveCount(0);
});
