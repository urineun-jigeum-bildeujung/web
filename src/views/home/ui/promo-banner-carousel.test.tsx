// 배너가 저절로 넘어가는지, 사용자가 옮길 수 있는지, 멈춰야 할 때 멈추는지를 본다.
// 이미지 자체(자르기·비율)는 CSS가 맡아 여기서 보지 않는다.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { PromoBannerCarousel } from "./promo-banner-carousel";

/** jsdom은 레이아웃을 재지 않아 폭이 0이다. 옮긴 거리를 볼 수 있게 폭을 정해 준다 */
const TRACK_WIDTH = 400;

function dots() {
  return screen.getAllByRole("button", { name: /배너 보기$/ });
}

/** 타이머로 일어난 상태 변화까지 화면에 반영한다 */
function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
}

/** 지금 보고 있다고 표시된 배너의 순번(0부터) */
function shownIndex() {
  return dots().findIndex((dot) => dot.getAttribute("aria-current") === "true");
}

let scrollTo: MockInstance;

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => TRACK_WIDTH,
  });
  // 셋업이 채워 둔 빈 구현(vitest.setup.ts)을 그대로 두고 어디로 옮겼는지만 기록한다
  scrollTo = vi.spyOn(Element.prototype, "scrollTo");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("배너 셋을 이미지 안 문구와 함께 그리고, 첫 장만 먼저 받는다", () => {
  render(<PromoBannerCarousel />);

  const banners = screen.getAllByRole("img");
  expect(banners).toHaveLength(3);
  expect(banners[0].getAttribute("alt")).toContain("타임딜 특가");
  expect(banners[1].getAttribute("alt")).toContain("건강한 간식");
  expect(banners[2].getAttribute("alt")).toContain("면역 케어 영양제");

  // 첫 화면 가장 큰 이미지라 첫 장만 먼저 받고 나머지는 볼 때 받는다 (AGENTS 5.6).
  // 먼저 받는 이미지에는 Next가 loading을 붙이지 않는다
  expect(banners[0].getAttribute("loading")).toBeNull();
  expect(banners[1].getAttribute("loading")).toBe("lazy");
  expect(banners[2].getAttribute("loading")).toBe("lazy");
});

it("점은 장식이 아니라 지금 어느 배너인지를 알린다", () => {
  render(<PromoBannerCarousel />);

  expect(dots()).toHaveLength(3);
  expect(shownIndex()).toBe(0);
});

it("점을 누르면 그 배너로 옮기고 표시도 따라간다", () => {
  render(<PromoBannerCarousel />);

  fireEvent.click(dots()[2]);

  expect(scrollTo).toHaveBeenCalledWith({ left: 2 * TRACK_WIDTH });
  expect(shownIndex()).toBe(2);
});

it("손으로 밀어 넘겨도 표시가 따라간다", () => {
  render(<PromoBannerCarousel />);

  const track = screen.getAllByRole("img")[0].closest("div")!.parentElement!;
  fireEvent.scroll(track, { target: { scrollLeft: TRACK_WIDTH } });

  expect(shownIndex()).toBe(1);
});

// 모바일의 탄성 스크롤은 양 끝에서 범위 밖 scrollLeft를 준다
it("범위를 벗어난 스크롤에서도 있는 배너만 가리킨다", () => {
  render(<PromoBannerCarousel />);
  const track = screen.getAllByRole("img")[0].closest("div")!.parentElement!;

  fireEvent.scroll(track, { target: { scrollLeft: -TRACK_WIDTH } });
  expect(shownIndex()).toBe(0);

  fireEvent.scroll(track, { target: { scrollLeft: 9 * TRACK_WIDTH } });
  expect(shownIndex()).toBe(2);
});

describe("자동 전환", () => {
  beforeEach(() => {
    // 렌더가 기다리는 Promise가 멈추지 않게 실제 시간도 흐르게 둔다 (#571)
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("5초마다 다음 배너로 넘어가고, 끝나면 처음으로 돌아온다", () => {
    render(<PromoBannerCarousel />);

    advance(5000);
    expect(shownIndex()).toBe(1);

    advance(5000);
    expect(shownIndex()).toBe(2);

    advance(5000);
    expect(shownIndex()).toBe(0);
  });

  it("마우스가 올라와 있는 동안에는 넘어가지 않는다", () => {
    render(<PromoBannerCarousel />);
    const section = screen.getByRole("region", { name: "진행 중인 행사" });

    fireEvent.mouseEnter(section);
    advance(15000);
    expect(shownIndex()).toBe(0);

    // 떠나면 다시 흐른다
    fireEvent.mouseLeave(section);
    advance(5000);
    expect(shownIndex()).toBe(1);
  });

  it("손으로 옮긴 직후에는 시계를 처음부터 다시 센다", () => {
    render(<PromoBannerCarousel />);

    advance(4000);
    fireEvent.click(dots()[2]);

    // 방금 고른 배너를 1초 만에 뺏기지 않는다
    advance(4000);
    expect(shownIndex()).toBe(2);

    advance(1500);
    expect(shownIndex()).toBe(0);
  });

  it("점에 초점이 들어와 있는 동안에는 넘어가지 않는다", () => {
    render(<PromoBannerCarousel />);

    fireEvent.focus(dots()[0]);
    advance(15000);

    expect(shownIndex()).toBe(0);
  });

  it("움직임 줄이기를 켠 사용자에게는 넘기지 않는다", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      media: "(prefers-reduced-motion: reduce)",
      matches: true,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);

    render(<PromoBannerCarousel />);
    advance(15000);

    expect(shownIndex()).toBe(0);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
