// 테스트 환경 보정. jsdom에 없는 브라우저 API를 채운다.

// Radix의 Slider·Popover 등이 크기를 재려고 ResizeObserver를 쓰는데 jsdom에는 없다.
// 실제 크기를 재지 않아도 렌더는 되므로 빈 구현으로 채운다.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Radix Select는 열 때 고른 항목으로 스크롤을 옮기고 포인터 캡처를 쓴다. jsdom에는 셋 다 없어
// 여는 순간 터진다. 실제로 스크롤하거나 포인터를 잡지 않아도 렌더는 되므로 빈 구현으로 채운다.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

// 목록 끝을 지켜보는 IntersectionObserver도 jsdom에 없다. 실제로 교차를 재지 않아도
// 렌더는 되므로 빈 구현으로 채운다. 교차 시점을 흉내 내야 하는 테스트는 직접 목으로 덮는다.
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
}
