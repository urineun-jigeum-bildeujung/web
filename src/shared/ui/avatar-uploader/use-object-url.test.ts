// 미리보기 주소 훅 테스트. 파일이 바뀌거나 화면에서 빠지면 거두는지, StrictMode가 effect를 다시 돌려도 쓰는 주소가 살아 있는지 본다.
import { renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { useObjectUrl } from "./use-object-url";

let seq = 0;
const revoked = new Set<string>();

beforeEach(() => {
  seq = 0;
  revoked.clear();
  // jsdom에는 createObjectURL이 없다. 만들 때마다 다른 주소를 줘 무엇을 거뒀는지 가린다
  URL.createObjectURL = vi.fn(() => `blob:preview-${++seq}`);
  URL.revokeObjectURL = vi.fn((url: string) => void revoked.add(url));
});

// 렌더 콜백 안에서 만들면 렌더마다 새 파일이 되어 주소를 끝없이 다시 만든다. 밖에서 만든다
const photo = (name: string) => new File([name], `${name}.jpg`, { type: "image/jpeg" });

test("파일이 없으면 주소를 만들지 않는다", () => {
  const { result } = renderHook(() => useObjectUrl(null));

  expect(result.current).toBeNull();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});

test("파일의 주소를 만들고 화면에서 빠지면 거둔다", () => {
  const file = photo("a");
  const { result, unmount } = renderHook(() => useObjectUrl(file));
  const shown = result.current;

  expect(shown).toBe("blob:preview-1");
  unmount();
  expect(revoked.has("blob:preview-1")).toBe(true);
});

test("파일이 바뀌면 옛 주소를 거두고 새로 만든다", () => {
  const { result, rerender } = renderHook(({ file }) => useObjectUrl(file), {
    initialProps: { file: photo("a") },
  });
  const old = result.current;

  rerender({ file: photo("b") });

  expect(revoked.has(old ?? "")).toBe(true);
  expect(result.current).toBe("blob:preview-2");
  expect(revoked.has("blob:preview-2")).toBe(false);
});

// 개발 모드의 StrictMode는 effect를 정리→다시 실행한다. 렌더에서 만들고 정리에서 거두면
// 이때 쓰는 주소가 거둬져 미리보기가 깨진다 (#409 리뷰와 같은 까닭)
test("StrictMode가 effect를 다시 돌려도 지금 쓰는 주소는 거두지 않는다", () => {
  const file = photo("a");
  const { result } = renderHook(() => useObjectUrl(file), { reactStrictMode: true });

  expect(result.current).toMatch(/^blob:/);
  expect(revoked.has(result.current ?? "")).toBe(false);
});
