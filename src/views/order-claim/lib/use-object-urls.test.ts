// 미리보기 주소 훅 테스트. 만든 주소를 거두는지, StrictMode가 effect를 다시 돌려도 쓰는 주소가 살아 있는지 본다.
import { renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { useObjectUrls } from "./use-object-urls";

let seq = 0;
const revoked = new Set<string>();

beforeEach(() => {
  seq = 0;
  revoked.clear();
  // jsdom에는 createObjectURL이 없다. 만들 때마다 다른 주소를 줘 무엇을 거뒀는지 가린다
  URL.createObjectURL = vi.fn(() => `blob:preview-${++seq}`);
  URL.revokeObjectURL = vi.fn((url: string) => void revoked.add(url));
});

const photo = (name: string) => new File([name], `${name}.jpg`, { type: "image/jpeg" });

test("파일마다 주소를 만들고 화면에서 빠지면 거둔다", () => {
  const files = [photo("a"), photo("b")];
  const { result, unmount } = renderHook(() => useObjectUrls(files));

  expect(result.current).toHaveLength(2);
  expect(result.current.every((url) => url.startsWith("blob:"))).toBe(true);

  const shown = result.current;
  unmount();
  expect(shown.every((url) => revoked.has(url))).toBe(true);
});

test("파일 목록이 바뀌면 옛 주소를 거두고 새로 만든다", () => {
  const first = [photo("a")];
  const { result, rerender } = renderHook(({ files }) => useObjectUrls(files), {
    initialProps: { files: first },
  });
  const old = result.current[0];

  rerender({ files: [...first, photo("b")] });

  expect(revoked.has(old)).toBe(true);
  expect(result.current).toHaveLength(2);
  expect(result.current.some((url) => revoked.has(url))).toBe(false);
});

// 개발 모드의 StrictMode는 effect를 정리→다시 실행한다. 렌더에서 만들고 정리에서 거두던
// 때는 이때 쓰는 주소가 거둬져 미리보기가 깨질 수 있었다 (#409 리뷰)
test("StrictMode가 effect를 다시 돌려도 지금 쓰는 주소는 거두지 않는다", () => {
  const files = [photo("a"), photo("b")];
  // **`wrapper`로 StrictMode를 씌우면 effect가 두 번 돌지 않는다**(이 환경에서 확인). 옵션으로 켠다
  const { result } = renderHook(() => useObjectUrls(files), { reactStrictMode: true });

  expect(result.current).toHaveLength(2);
  expect(result.current.some((url) => revoked.has(url))).toBe(false);
});
