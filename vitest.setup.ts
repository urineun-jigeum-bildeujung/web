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
