// 반응형 대응이 끝난 화면 넷이 태블릿·웹 폭에서 제 폭을 지키는지 본다(#132).
//
// **가로 넘침만 보면 부족하다.** 화면이 실수로 420px 기둥에 다시 들어가도 넘침은 0이라
// 통과한다. 그래서 최상위 폭과 가운데 정렬까지 함께 잰다.
//
// **1200이 아니라 1920에서 잰다.** 1200에서는 `max-w-300`이 없어도 폭이 뷰포트와 같아
// 최대 폭 제한과 가운데 정렬을 구분하지 못한다.
import { expect, test, type Page } from "@playwright/test";

/** `(constrained)` 밖으로 나온 화면들. 각자 `mx-auto w-full max-w-300` 기둥을 갖는다 */
const ROUTES = ["/", "/search", "/search/result?q=사료", "/products/1"];

/** `max-w-300` = 300 × 4px */
const CONTENT_MAX = 1200;

/** PD 확정이 카드 170px 고정·사이 13px이라 폭이 넓어져도 카드는 그대로다(#569) */
const CARD_WIDTH = 170;

async function measure(page: Page, route: string) {
  // `networkidle`은 Playwright가 테스트에 쓰지 말라고 표시한 옵션이다. 재는 것이 `main`의
  // 가로 폭과 좌표라 이미지 로딩과 무관한데, 1920에서는 첫 화면에 드는 이미지가 많아
  // 요청이 끊이지 않고 진입 자체가 시간을 넘겼다. 준비 상태는 단정문으로 기다린다
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const mainLocator = page.getByRole("main");
  await expect(mainLocator).toBeVisible();
  return mainLocator.evaluate((element) => {
    const main = element.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      width: Math.round(main.width),
      left: Math.round(main.left),
      viewport: document.documentElement.clientWidth,
    };
  });
}

test.describe("태블릿 768", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  for (const route of ROUTES) {
    test(`${route} — 뷰포트 폭을 그대로 쓴다`, async ({ page }) => {
      const layout = await measure(page, route);

      expect(layout.overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
      // 420이 나오면 기둥 안으로 되돌아간 것이다
      expect(layout.width, "화면이 뷰포트 폭을 쓰지 않는다").toBe(layout.viewport);
    });
  }
});

test.describe("웹 1920", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  for (const route of ROUTES) {
    test(`${route} — 1200px로 제한되고 가운데 정렬된다`, async ({ page }) => {
      const layout = await measure(page, route);

      expect(layout.overflow, "가로 스크롤이 생겼다").toBeLessThanOrEqual(0);
      expect(layout.width, "콘텐츠 최대 폭이 걸리지 않았다").toBe(CONTENT_MAX);
      expect(layout.left, "가운데 정렬이 아니다").toBe((layout.viewport - CONTENT_MAX) / 2);
    });
  }
});

/* 격자는 열 수를 바꾸지 않고 카드를 170px로 고정해 채운다(#569). 폭이 달라져도 카드는 같다 */
const GRIDS = [
  { name: "홈 종류 탭", route: "/?category=food" },
  { name: "검색 결과", route: "/search/result?q=사료" },
];

for (const { name, route } of GRIDS) {
  for (const width of [768, 1920]) {
    test(`${name} — ${width}px에서도 카드가 ${CARD_WIDTH}px이다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1024 });
      await page.goto(route, { waitUntil: "domcontentloaded" });

      // 카드가 보일 때까지는 아래 단정문이 기다린다(위 measure와 같은 이유)
      const card = page.getByRole("main").getByRole("link").first();
      await expect(card).toBeVisible();
      const box = await card.boundingBox();

      expect(Math.round(box!.width), "카드 폭이 달라졌다").toBe(CARD_WIDTH);
    });
  }
}
