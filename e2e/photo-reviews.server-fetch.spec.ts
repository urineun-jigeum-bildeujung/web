// 사진 리뷰: 리뷰 탭에서 격자를 거쳐 사진 한 장까지 가는 길이 이어지는지 본다.
//
// 출발점이 상품 상세라 서버 조회 전용 스위트에 있다(#413). 리뷰 목록·사진·대표 사진은
// 브라우저에서 부르는데, 이 설정은 `NEXT_PUBLIC_API_BASE_URL`도 목 서버를 가리켜 함께 닿는다.
import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures/session";

// 이 화면은 로그인해야 열린다. 세션이 없으면 로그인으로 보낸다(#542)
test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("리뷰 탭이 서버가 준 후기를 그린다", async ({ page }) => {
  await page.goto("/products/1?tab=review");

  // 목록 응답에는 닉네임이 있다
  await expect(page.getByText("댕댕이맘", { exact: true })).toBeVisible();
  // 아이 줄은 품종명으로 적는다. 아이가 여럿이면 줄이지 않고 `/`로 나눈다
  await expect(page.getByText("시츄 · 8세 · 4kg / 먼치킨 · 3세 · 4.2kg")).toBeVisible();
  await expect(page.getByText("허스키 · 6세 · 28kg")).toBeVisible();
  await expect(page.getByText("총 리뷰 3개")).toBeVisible();
});

// 맞춤보기는 서버가 종과 체구만 견주어 안내 문구와 달라 PD 확인을 기다린다(#472)
test("맞춤보기 토글은 리뷰 탭에 아직 없다", async ({ page }) => {
  await page.goto("/products/1?tab=review");
  await expect(page.getByText("댕댕이맘", { exact: true })).toBeVisible();

  await expect(page.getByRole("switch")).toBeHidden();
  await expect(page.getByText("내 반려동물 맞춤보기")).toBeHidden();
});

// 백엔드가 구간·복수 조건을 받게 되어 거르기 시트를 다시 붙였다(#472).
// 거르는 것은 서버다 — 고른 조건이 요청 파라미터로 나가고 주소에 남는지 본다
test("거르기 시트에서 종을 고르고 적용하면 그 조건으로 다시 받고 주소에 남는다", async ({
  page,
}) => {
  const searches: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith("/reviews/products/1")) searches.push(url.search);
  });

  await page.goto("/products/1?tab=review");
  await expect(page.getByText("댕댕이맘", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "기본 맞춤 필터" }).click();
  await page.getByRole("tab", { name: "반려동물 필터" }).click();
  await page.getByRole("radio", { name: "고양이" }).click();
  await page.getByRole("button", { name: /^리뷰 .*보기$/ }).click();

  await expect(page).toHaveURL(/reviewFilter=species%3Acat|reviewFilter=species:cat/);
  await expect.poll(() => searches.some((search) => search.includes("species=CAT"))).toBe(true);
  await expect(page.getByRole("button", { name: "필터 지우기" }).first()).toBeVisible();
});

// 비로그인 정책이 정해져(#542) 누를 수 있게 됐다(#606, QA 상품상세 7·8).
// 목 서버는 상태를 들지 않아 토글 요청은 여기서 받는다. 목록은 누른 뒤 다시 받지 않는다
test("리뷰 탭의 도움돼요를 누르면 수가 오르고, 다시 누르면 풀린다", async ({ page }) => {
  const toggled: string[] = [];
  await page.route("**/api/v1/reviews/*/recommend", (route) => {
    toggled.push(route.request().method());
    return route.fulfill({ status: 200 });
  });
  await page.goto("/products/1?tab=review");

  // 첫 후기(7번)는 아직 누르지 않은 32다
  const helpful = page.getByRole("button", { name: /도움이 됐다고 했어요/ }).first();
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
  await expect(helpful).toContainText("32");

  await helpful.click();
  await expect(helpful).toHaveAttribute("aria-pressed", "true");
  await expect(helpful).toContainText("33");

  await helpful.click();
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
  await expect(helpful).toContainText("32");
  expect(toggled).toEqual(["PATCH", "PATCH"]);
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

// 공개 상세에 닉네임과 도움돼요가 실려 뷰어 카드가 목록 카드와 같은 모양이 됐다(#471)
test("뷰어 카드가 목록 카드와 같은 내용을 보여준다", async ({ page }) => {
  await page.goto("/products/1/photos?photo=7&n=0");

  const card = page.getByRole("dialog").getByRole("article");
  await expect(card.getByText("시츄 · 8세 · 4kg / 먼치킨 · 3세 · 4.2kg")).toBeVisible();
  await expect(card.getByText("확실히 예전보다 계단 오를 때 덜 힘들어해요.")).toBeVisible();
  await expect(card.getByText("사용 3주째")).toBeVisible();

  await expect(card.getByText("댕댕이맘", { exact: true })).toBeVisible();
  await expect(card.getByText("도움이 됐다고 했어요")).toBeVisible();
});

// 리뷰 상세의 도움돼요(QA 상품상세 17). 뷰어는 끝난 뒤 상세를 다시 받으므로, 토글을 받아 상세
// 응답에 되비춰 서버가 기억하는 것처럼 세운다
test("뷰어 카드의 도움돼요도 누르고 풀 수 있다", async ({ page }) => {
  let liked = false;
  await page.route("**/api/v1/reviews/7/recommend", (route) => {
    liked = !liked;
    return route.fulfill({ status: 200 });
  });
  await page.route("**/api/v1/reviews/7", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    return route.fulfill({
      response,
      json: { ...body, liked, likeCount: body.likeCount + (liked ? 1 : 0) },
    });
  });
  await page.goto("/products/1/photos?photo=7&n=0");

  const helpful = page.getByRole("dialog").getByRole("button", { name: /도움이 됐다고 했어요/ });
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
  await expect(helpful).toContainText("32");

  await helpful.click();
  await expect(helpful).toHaveAttribute("aria-pressed", "true");
  await expect(helpful).toContainText("33");

  await helpful.click();
  await expect(helpful).toHaveAttribute("aria-pressed", "false");
  await expect(helpful).toContainText("32");
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
