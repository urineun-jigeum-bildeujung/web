// 사진 리뷰: 리뷰 탭에서 격자를 거쳐 사진 한 장까지 가는 길이 이어지는지 본다.
//
// 출발점이 상품 상세라 서버 조회 전용 스위트에 있다(#413). 리뷰 목록·사진·대표 사진은
// 브라우저에서 부르는데, 이 설정은 `NEXT_PUBLIC_API_BASE_URL`도 목 서버를 가리켜 함께 닿는다.
import { expect, test } from "@playwright/test";

test("리뷰 탭이 서버가 준 후기를 그린다", async ({ page }) => {
  await page.goto("/products/1?tab=review");

  // 목록 응답에는 닉네임이 있다
  await expect(page.getByText("댕댕이맘", { exact: true })).toBeVisible();
  // 품종명과 몸무게가 응답에 없어 체구와 나이까지만 그린다. 아이가 여럿이면 전부 적는다
  await expect(page.getByText("소형견 · 8세, 고양이 · 3세")).toBeVisible();
  await expect(page.getByText("대형견 · 6세")).toBeVisible();
  await expect(page.getByText("총 리뷰 3개")).toBeVisible();
});

// 서버가 받는 모양과 화면이 고르는 모양이 달라 닫아 뒀다(#339)
test("계약이 없는 필터·맞춤보기·도움돼요 버튼은 리뷰 탭에 없다", async ({ page }) => {
  await page.goto("/products/1?tab=review");
  await expect(page.getByText("댕댕이맘", { exact: true })).toBeVisible();

  await expect(page.getByRole("switch")).toBeHidden();
  await expect(page.getByText("내 반려동물 맞춤보기")).toBeHidden();
  await expect(page.getByRole("button", { name: /도움이 됐어요/ })).toBeHidden();
  // 도움돼요 수 자체는 목록 응답에 있어 읽기 전용으로 보인다
  await expect(page.getByText("32", { exact: true })).toBeVisible();
});

// 사진을 열면 주소가 바뀌어야 공유되고, 뒤로가기가 격자로 돌아와야 한다.
// nuqs 기본인 replace로 두면 격자를 건너뛰고 상품 상세로 나간다(#151).
test("리뷰 탭에서 사진을 골라 열고 뒤로가기 한 번에 격자로 돌아온다", async ({ page }) => {
  await page.goto("/products/1?tab=review");

  await page.getByRole("link", { name: "전체보기" }).click();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);
  await expect(page.getByRole("heading", { name: "사진 리뷰" })).toBeVisible();

  // 격자 두 번째 칸은 7번 후기의 두 번째 사진이다
  await page
    .getByRole("button", { name: /크게 보기/ })
    .nth(1)
    .click();

  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  // 주소는 배열 순번이 아니라 후기 번호로 자리를 가리킨다(#339)
  await expect(page).toHaveURL(/[?&]photo=7/);
  await expect(page).toHaveURL(/[?&]n=1/);
  await expect(viewer.getByText("2장 중 2번째")).toBeVisible();

  // **두 쿼리를 한 번에 갱신하므로 히스토리가 한 칸만 쌓인다.** 따로 갱신하면 여기서
  // 뒤로가기를 두 번 눌러야 격자로 돌아온다
  await page.goBack();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);
});

test("대표 사진을 누르면 그 후기의 첫 사진이 열린다", async ({ page }) => {
  await page.goto("/products/1?tab=review");

  // 대표 사진은 서버가 sortOrder 0으로 고른 그 후기의 첫 장이다
  await page.getByRole("link", { name: "이 후기의 첫 사진 크게 보기" }).first().click();

  await expect(page).toHaveURL(/\/products\/1\/photos\?/);
  await expect(page).toHaveURL(/[?&]photo=7/);
  await expect(page).toHaveURL(/[?&]n=0/);
  await expect(page.getByRole("dialog").getByText("2장 중 1번째")).toBeVisible();
});

test("좌우로 넘기면 같은 후기의 다른 사진으로 이동한다", async ({ page }) => {
  await page.goto("/products/1/photos?photo=7&n=0");

  const viewer = page.getByRole("dialog");
  await expect(viewer.getByText("2장 중 1번째")).toBeVisible();
  // 첫 장에서는 뒤로 갈 곳이 없다
  await expect(page.getByRole("button", { name: "이전 사진" })).toBeDisabled();

  await page.getByRole("button", { name: "다음 사진" }).click();
  await expect(viewer.getByText("2장 중 2번째")).toBeVisible();
  await expect(page.getByRole("button", { name: "다음 사진" })).toBeDisabled();
});

// 공개 리뷰 상세에 닉네임과 도움돼요 수가 없다. 진짜 후기 글에 다른 이름표를 붙이지 않는다
test("뷰어 카드는 상세로 채울 수 있는 것만 보여준다", async ({ page }) => {
  await page.goto("/products/1/photos?photo=7&n=0");

  const card = page.getByRole("dialog").getByRole("article");
  await expect(card.getByText("소형견 · 8세, 고양이 · 3세")).toBeVisible();
  await expect(card.getByText("확실히 예전보다 계단 오를 때 덜 힘들어해요.")).toBeVisible();
  await expect(card.getByText("사용 21일")).toBeVisible();

  await expect(card.getByText("댕댕이맘", { exact: true })).toBeHidden();
  await expect(card.getByText("도움이 됐다고 했어요")).toBeHidden();
});

// 주소로 바로 들어오면 되감을 기록이 없다. 쿼리만 지워야 격자에 남는다
test("주소로 바로 들어온 뷰어를 닫으면 격자로 돌아온다", async ({ page }) => {
  await page.goto("/products/1/photos?photo=9&n=0");
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "닫기" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);
});

// **격자에서 연 뷰어는 닫을 때 기록을 되감는다.** 쿼리만 지우면 같은 격자 기록이 둘 남아,
// 닫은 뒤 뒤로가기를 눌러도 격자에 한 번 더 머문다
test("격자에서 연 뷰어를 닫으면 기록이 한 칸만 남는다", async ({ page }) => {
  await page.goto("/products/1?tab=review");
  await page.getByRole("link", { name: "전체보기" }).click();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);

  await page
    .getByRole("button", { name: /크게 보기/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "닫기" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page).toHaveURL(/\/products\/1\/photos$/);

  // 한 번만 뒤로 가면 상품 상세다. 기록이 둘이면 여기서 격자에 한 번 더 머문다
  await page.goBack();
  await expect(page).toHaveURL(/\/products\/1\?tab=review$/);
});

test("사진이 없는 상품은 빈 상태를 보여준다", async ({ page }) => {
  await page.goto("/products/999/photos");

  await expect(page.getByText("아직 사진 후기가 없어요")).toBeVisible();
  await expect(page.getByRole("button", { name: /크게 보기/ })).toHaveCount(0);
});
