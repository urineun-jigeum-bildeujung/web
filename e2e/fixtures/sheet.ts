// 바텀시트 안에 더 내릴 것이 남았는지 잰다. vaul이 시트 본체에 붙이는 꼬리(::after, 아래로 시트
// 높이의 200%)가 스크롤 영역에 들어가면 내용이 다 보이는데도 빈 자리가 길게 스크롤된다(#561).
// 어느 요소가 스크롤을 맡는지에 기대지 않도록 시트 자신과 그 안의 스크롤 영역을 모두 본다.

import { expect, type Locator } from "@playwright/test";

/** 내용이 다 보이는 시트 안에 더 내릴 것이 없다 */
export async function expectNoBlankScroll(sheet: Locator) {
  await expect(sheet).toBeVisible();
  const leftovers = await sheet.evaluate((root) =>
    [root, ...root.querySelectorAll("*")]
      .filter((element) => ["auto", "scroll"].includes(getComputedStyle(element).overflowY))
      .map((element) => element.scrollHeight - element.clientHeight),
  );
  for (const left of leftovers) {
    // 소수점 높이가 반올림되며 1px이 남을 수 있다
    expect(left, "시트 안에 빈 스크롤이 남았다").toBeLessThanOrEqual(1);
  }
}

/**
 * `target`을 담은 스크롤 영역을 끝까지 내린 뒤, 그 영역 아래 끝과 `target` 아래 끝 사이의 거리(px).
 * 넘친 만큼만 스크롤되면 시트 아래 여백만 남는다. 스크롤할 것이 없으면 null이다
 */
export function blankBelowAfterScrollEnd(target: Locator) {
  return target.evaluate((element) => {
    let scroller = element.parentElement;
    while (
      scroller &&
      !(
        scroller.scrollHeight > scroller.clientHeight + 1 &&
        ["auto", "scroll"].includes(getComputedStyle(scroller).overflowY)
      )
    ) {
      scroller = scroller.parentElement;
    }
    if (!scroller) return null;
    scroller.scrollTop = scroller.scrollHeight;
    return scroller.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom;
  });
}
