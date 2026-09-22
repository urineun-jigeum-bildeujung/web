// 뒤로가기가 탭·단계 전환을 건너뛰지 않는지 본다.
// nuqs 기본값(replace)이면 히스토리에 쌓이지 않아 화면을 통째로 떠난다.
import { expect, test } from "@playwright/test";

import { stubPetCatalog } from "./fixtures/pet-catalog";

// 아이 관리 화면이 아이 목록을 서버에서 받는다(#230). 세우지 않으면 401이라
// 로그인으로 돌려보내져 탭·필터를 눌러 볼 자리가 없다
test.beforeEach(async ({ page }) => {
  await stubPetCatalog(page);
});

// 좋아요 화면의 "최근에 봤어요"·"자주 샀어요" 탭은 MVP 범위 밖이라 탭도 주소도
// 찜 탭 하나로 막혀 있다(#274 리뷰) — 옮겨 갈 다른 탭이 없어 이 화면에서는
// 탭 전환 뒤로가기를 더 시험할 수 없다. 여러 탭을 오가는 이 패턴은 아래
// "메인에서 종류를 고른 뒤" 시험이 대신 커버한다

test("메인에서 종류를 고른 뒤 뒤로가기로 전체 탭에 돌아온다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "사료", exact: true }).click();
  await expect(page).toHaveURL(/category=food/);

  await page.goBack();
  // 전체 탭은 큐레이션이라 종류 목록과 구성이 다르다
  await expect(page.getByText(/AI가 골라주는/)).toBeVisible();
});

test("온보딩에서 입력하다 뒤로가기를 눌러도 입력값이 남는다", async ({ page }) => {
  await page.goto("/onboarding");

  await page.getByRole("button", { name: "프로필 입력하기" }).click();
  await expect(page).toHaveURL(/step=basic/);

  // 시안에서 세 항목이 모두 차야 다음 버튼이 켜진다
  await page.getByLabel("아이의 이름을 알려주세요").fill("보리");
  await page
    .getByRole("radiogroup", { name: "아이의 성별" })
    .getByText("남자아이", { exact: true })
    .click();
  await page
    .getByRole("radiogroup", { name: "중성화 여부" })
    .getByText("했어요", { exact: true })
    .click();
  await page.getByRole("button", { name: "다음 단계 작성하기" }).click();
  await expect(page).toHaveURL(/step=detail/);

  await page.goBack();
  // 온보딩을 떠나지 않고 이전 단계로 돌아오며, 친 이름도 그대로다
  await expect(page).toHaveURL(/step=basic/);
  await expect(page.getByLabel("아이의 이름을 알려주세요")).toHaveValue("보리");
});

// 아이 제품 관리의 거르기 칩(전체·미입력·입력)은 답한 항목을 주는 API가 없어 빠졌다(#345).
// 같은 목록을 좁히는 필터가 히스토리에 안 쌓이는지는 추천 화면의 분류로 본다
test("필터는 히스토리에 쌓이지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.goto("/recommendations");

  const categories = page.getByRole("navigation", { name: "상품 분류" });
  await categories.getByRole("button", { name: "사료", exact: true }).click();
  await expect(page).toHaveURL(/category=food/);
  await categories.getByRole("button", { name: "간식", exact: true }).click();
  await expect(page).toHaveURL(/category=snack/);

  // 같은 목록을 좁히는 것이라 한 번에 추천 화면에 들어오기 전으로 돌아가야 한다
  await page.goBack();
  await expect(page).not.toHaveURL(/recommendations/);
});

test("주소에 없는 아이 id가 와도 화면이 한 아이를 가리킨다", async ({ page }) => {
  await page.goto("/recommendations?pet=unknown");

  // 목록에 없는 id면 첫 아이로 되돌린다. 고르는 자리도 같은 아이를 가리켜야 한다
  await expect(page.getByRole("combobox", { name: "어느 아이의 추천을 볼지" })).toContainText(
    "코코",
  );
  await expect(page.getByText(/코코/).first()).toBeVisible();
});
