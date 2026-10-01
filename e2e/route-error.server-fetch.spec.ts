// 서버 조회가 실패해도 갇히지 않는지 본다 (#620).
//
// **경계가 없던 동안 두 공개 화면은 링크가 하나도 없는 화면이 됐다.** 전역 `app/error.tsx`가
// 화면을 통째로 덮는데, 이 프로젝트는 머리말과 하단 이동 줄을 화면이 직접 그려서 라우트가
// 실패하면 그 둘이 함께 날아갔다. "다시 시도하기"는 같은 실패를 되풀이해 브라우저 뒤로가기
// 말고는 나갈 길이 없었다. 메인은 구역 경계가 있어 멀쩡했다(#289).
//
// **단위 테스트로는 못 잡는다.** 검색 결과 테스트가 바깥에 제 `ErrorBoundary`를 씌워 보고 있어
// 실제 트리에 경계가 없다는 사실이 가려졌다. 그래서 여기서 실제 화면으로 고정한다.
//
// **이 스위트여야 한다.** 브라우저 스위트의 dev 서버는 `API_BASE_URL_INTERNAL`이 없어 조회가
// **설정 오류**로 실패하는데, 그건 Next가 실제 API 실패와 다르게 다룬다(#620에서 실측). 목 서버가
// 500을 주는 이 스위트가 배포 상황에 맞는 자리다 — `mock-api-server.mjs`의 `isForcedFailure`가
// 상품 `500`과 검색어 `서버오류`를 그 자리로 예약해 둔다.
import { expect, test } from "@playwright/test";

test("검색 결과는 머리말·검색바·하단 이동 줄을 지키고 결과 칸만 바뀐다", async ({ page }) => {
  await page.goto("/search/result?q=서버오류");

  // 실패는 결과 칸 안에서만 알린다
  await expect(page.getByRole("main").getByRole("alert")).toContainText("잠시 문제가 생겼어요");

  // 이것이 이 테스트가 막는 회귀다 — 검색어를 고치러 갈 길과 다른 화면으로 갈 길이 남아야 한다
  await expect(page.getByRole("button", { name: /검색어 고치기/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "주요 화면" })).toBeVisible();

  // 제목은 그대로다. 화면이 통째로 바뀌지 않았다는 뜻이다
  await expect(page.getByRole("heading", { name: "검색 결과" })).toBeVisible();
});

test("상품 상세는 머리말을 지켜 뒤로 갈 수 있다", async ({ page }) => {
  await page.goto("/products/500");

  // 세그먼트 `error.tsx`가 전역과 같은 문구로 알린다.
  // `main` 안으로 좁히는 이유는 Next가 라우트 안내용 `role="alert"`을 늘 하나 더 두기 때문이다
  await expect(page.getByRole("main").getByRole("alert")).toContainText("앗, 잠시 화면이 멈췄어요");

  // 상세에는 하단 이동 줄이 없다. 머리말의 뒤로가기·알림·장바구니가 나갈 길이다
  await expect(page.getByRole("button", { name: "이전 화면으로" })).toBeVisible();
  await expect(page.getByRole("link", { name: "장바구니" })).toBeVisible();
});

// 404는 실패가 아니라 "없는 상품"이다. 고치면서 이 길이 섞이지 않았는지 함께 본다
test("없는 상품은 그대로 404 화면으로 간다", async ({ page }) => {
  await page.goto("/products/9999");

  await expect(page.getByText("앗, 길을 잘못 드신 것 같아요")).toBeVisible();
  // 실패 화면 문구가 섞여 들지 않았는지 본다
  await expect(page.getByText("앗, 잠시 화면이 멈췄어요")).toBeHidden();
});
