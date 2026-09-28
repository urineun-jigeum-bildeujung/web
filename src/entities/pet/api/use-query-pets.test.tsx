// 꺼 두면 부르지 않고 기다리는 중으로도 남지 않는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const getPets = vi.fn();
vi.mock("./pets", () => ({ getPets: () => getPets() }));

import { useQueryPets } from "./use-query-pets";

afterEach(() => getPets.mockReset());

// 로그인하지 않은 메인이 이렇게 부른다. 대기로 남으면 뼈대가 끝없이 떠 있다(#470)
test("꺼 두면 부르지 않고 기다리는 중도 아니다", () => {
  const { result } = renderHook(() => useQueryPets({ enabled: false }), {
    wrapper: createQueryWrapper(),
  });

  expect(getPets).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);
  expect(result.current.pets).toBeUndefined();
});

// 재발급 실패로 세션이 끊겨도 캐시는 남는다. 그때 옛 아이 이름을 보이면 안 된다
test("껐다가는 받아 둔 목록도 내주지 않는다", async () => {
  getPets.mockResolvedValue([{ id: "3", name: "코코", isDefault: true }]);
  const { result, rerender } = renderHook(({ enabled }) => useQueryPets({ enabled }), {
    wrapper: createQueryWrapper(),
    initialProps: { enabled: true },
  });
  await waitFor(() => expect(result.current.pets).toHaveLength(1));

  rerender({ enabled: false });

  expect(result.current.pets).toBeUndefined();
});

test("기본은 부르고, 받는 동안은 기다리는 중이다", async () => {
  getPets.mockResolvedValue([{ id: "3", name: "코코", isDefault: true }]);
  const { result } = renderHook(() => useQueryPets(), { wrapper: createQueryWrapper() });

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.pets).toHaveLength(1));
  expect(result.current.isLoading).toBe(false);
});
