// 메인 화면 E2E. 탭에 따라 화면이 통째로 바뀌는지, 상태 체크가 이어지는지 실제 브라우저에서 본다.
import { expect, test } from "@playwright/test";

import { stubCart } from "./fixtures/cart";
import { stubFeedbacks } from "./fixtures/feedback";
import { stubNotifications } from "./fixtures/notifications";
import { stubPetCatalog } from "./fixtures/pet-catalog";
import { signIn } from "./fixtures/session";

test("메인이 렌더링된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("골라주개냥")).toBeVisible();
  await expect(page.getByText(/AI가 골라주는/)).toBeVisible();
});

// 예시 아이(소리·냥이)를 쓰던 동안 마이페이지의 실제 이름과 달랐다(QA 1차 6번, #470)
test("로그인하면 아이 줄과 추천 제목이 실제 아이 이름을 쓴다", async ({ page }) => {
  await signIn(page);
  await stubPetCatalog(page);
  await stubNotifications(page);
  await stubCart(page);

  await page.goto("/");

  // 스텁의 기본 아이는 코코다
  await expect(page.getByRole("radio", { name: "코코" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("AI가 골라주는 코코 맞춤 상품")).toBeVisible();

  await page.getByRole("radio", { name: "보리" }).click();
  await expect(page.getByText("AI가 골라주는 보리 맞춤 상품")).toBeVisible();
});

// "종류를 고르면 상품 목록으로 바뀐다"는 카테고리 탭이 서버 조회를 타면서(#289)
// `home.server-fetch.spec.ts`로 옮겼다 — 이 파일이 쓰는 일반 E2E 잡은 백엔드가
// 없어 실제 조회가 실패하고, 그 결과를 이 스펙으로는 더 이상 확인할 수 없다

// 누구에게나 같은 목데이터 두 개가 뜨고 남긴 반응이 서버에 가지 않던 자리다 (#494)
test("반응을 남기면 서버에 보내고 어디에 쓰이는지 알린다", async ({ page }) => {
  await signIn(page);
  await stubPetCatalog(page);
  await stubNotifications(page);
  await stubCart(page);
  const feedbacks = await stubFeedbacks(page);

  await page.goto("/");

  await expect(page.getByText("치석 케어 덴탈껌 7개입")).toBeVisible();
  await page
    .getByRole("button", { name: /반응 남기기/ })
    .first()
    .click();
  await page.getByRole("radio", { name: "잘 맞았어요" }).click();
  await page.getByRole("button", { name: "등록하기" }).click();

  await expect(page.getByText(/다음 추천 적합도에 반영할게요/)).toBeVisible();
  // 항목의 아이가 비어 있으면(아이가 필수가 되기 전 주문) 메인에서 고른 아이(기본 아이 코코)다
  expect(feedbacks.sent).toEqual([
    { orderProductId: 11, petId: 3, postpone: false, answer: "GOOD" },
  ]);
});

test("항목에 아이가 있으면 그 아이에게 묻고 그 아이의 반응으로 보낸다", async ({ page }) => {
  await signIn(page);
  await stubPetCatalog(page);
  await stubNotifications(page);
  await stubCart(page);
  const feedbacks = await stubFeedbacks(page);

  await page.goto("/");

  // 둘째 항목은 보리에게 사 준 것이다. 메인에서 고른 아이(코코)가 아니다
  await page
    .getByRole("button", { name: /반응 남기기/ })
    .nth(1)
    .click();
  await expect(page.getByText("보리에게 잘 맞았나요?")).toBeVisible();
  await page.getByRole("radio", { name: "안 맞았어요" }).click();
  await page.getByRole("button", { name: "등록하기" }).click();

  await expect(page.getByText(/다음 추천 적합도에 반영할게요/)).toBeVisible();
  expect(feedbacks.sent).toEqual([
    { orderProductId: 12, petId: 7, postpone: false, answer: "BAD" },
  ]);
});

test("로그인하지 않았으면 최근에 구매한 상품을 부르지 않고 칸도 없다", async ({ page }) => {
  // 목록을 세워 둔다. 게이트가 빠지면 칸이 실제로 그려져 아래 단언이 흔들리지 않고 실패한다
  const feedbacks = await stubFeedbacks(page);

  await page.goto("/");
  await expect(page.getByText(/AI가 골라주는/)).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(feedbacks.listed()).toBe(0);
  await expect(page.getByText("최근에 구매한 상품, 아이는 어때요?")).toHaveCount(0);
});

test("만들어 둔 화면 목록은 개발용 경로로 갔다", async ({ page }) => {
  // 마이페이지는 세션이 없으면 로그인으로 보낸다(#447). 로그인하지 않으면 잠깐 스치는 `/mypage`를
  // 잡느냐의 경합이 되어 느린 서버에서 `/login`을 받고 흔들렸다(#560)
  await signIn(page);
  await page.goto("/dev/screens");

  for (const group of ["온보딩", "마이페이지"]) {
    await expect(page.getByRole("heading", { name: group })).toBeVisible();
  }

  const mypage = page.getByRole("link", { name: /마이페이지 홈/ });
  await mypage.click();
  await expect(page).toHaveURL(/\/mypage$/);
});

test("다크 모드 토글을 누르면 html에 dark 클래스가 붙는다", async ({ page }) => {
  await page.goto("/dev/screens");

  await page.getByRole("button", { name: "다크 모드로 전환" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "라이트 모드로 전환" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
