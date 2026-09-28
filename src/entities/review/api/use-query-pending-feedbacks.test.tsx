// 반응 대기 목록 훅 테스트. 꺼 두면 부르지 않고 기다리는 중으로도, 남은 캐시로도 남지 않는지 본다.
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const getPendingFeedbacks = vi.fn();
vi.mock("./feedbacks", () => ({ getPendingFeedbacks: () => getPendingFeedbacks() }));

import { useQueryPendingFeedbacks } from "./use-query-pending-feedbacks";

const ITEM = {
  orderProductId: "11",
  productId: "3",
  name: "저자극 덴탈껌",
  petId: null,
};

afterEach(() => getPendingFeedbacks.mockReset());

// 로그인하지 않은 메인이 이렇게 부른다. 대기로 남으면 뼈대가 끝없이 떠 있다 (#494)
test("꺼 두면 부르지 않고 기다리는 중도 아니다", () => {
  const { result } = renderHook(() => useQueryPendingFeedbacks({ enabled: false }), {
    wrapper: createQueryWrapper(),
  });

  expect(getPendingFeedbacks).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);
  expect(result.current.items).toBeUndefined();
});

// 재발급 실패로 세션이 끊겨도 캐시는 남는다. 그때 전의 구매 항목을 보이면 안 된다
test("껐다가는 받아 둔 목록도 내주지 않는다", async () => {
  getPendingFeedbacks.mockResolvedValue([ITEM]);
  const { result, rerender } = renderHook(({ enabled }) => useQueryPendingFeedbacks({ enabled }), {
    wrapper: createQueryWrapper(),
    initialProps: { enabled: true },
  });
  await waitFor(() => expect(result.current.items).toHaveLength(1));

  rerender({ enabled: false });

  expect(result.current.items).toBeUndefined();
});

// 마이페이지 아이 관리가 옵션 없이 부른다
test("기본은 부르고, 받는 동안은 기다리는 중이다", async () => {
  getPendingFeedbacks.mockResolvedValue([ITEM]);
  const { result } = renderHook(() => useQueryPendingFeedbacks(), {
    wrapper: createQueryWrapper(),
  });

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  expect(result.current.isLoading).toBe(false);
});

// 세션이 끊겨도 캐시에 남은 실패가 로그아웃한 메인에 오류 칸을 띄운다. 그 다시 시도는 인증 없이 나간다 (#498 점검)
test("껐다가는 받아 둔 실패도 내주지 않는다", async () => {
  getPendingFeedbacks.mockRejectedValue(new Error("401"));
  const { result, rerender } = renderHook(({ enabled }) => useQueryPendingFeedbacks({ enabled }), {
    wrapper: createQueryWrapper(),
    initialProps: { enabled: true },
  });
  await waitFor(() => expect(result.current.error).not.toBeNull());

  rerender({ enabled: false });

  expect(result.current.error).toBeNull();
  expect(result.current.isRetrying).toBe(false);
});

// 받아 둔 것 없이 실패한 뒤 다시 부르면 조회가 오류를 비우고 처음 받는 중으로 돌아간다.
// 그 동안을 다시 시도로 알려야 화면이 오류 칸을 지키고 대기를 보인다 (#498 점검)
test("받아 둔 것 없이 실패한 뒤 다시 받는 동안은 다시 시도 중이다", async () => {
  let resolve: (items: unknown[]) => void = () => {};
  getPendingFeedbacks
    .mockRejectedValueOnce(new Error("503"))
    .mockReturnValueOnce(new Promise((done) => (resolve = done)));
  const { result } = renderHook(() => useQueryPendingFeedbacks(), {
    wrapper: createQueryWrapper(),
  });
  // 처음 받는 중은 다시 시도가 아니다
  expect(result.current.isRetrying).toBe(false);
  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect(result.current.isRetrying).toBe(false);

  act(() => void result.current.refetch());
  await waitFor(() => expect(result.current.isRetrying).toBe(true));

  await act(async () => resolve([ITEM]));
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  expect(result.current.isRetrying).toBe(false);
});
