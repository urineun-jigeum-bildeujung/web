// 아이가 없으면 부르지 않는지, 실패를 오류 경계로 던지는지 본다(#600).
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const getHomeRecommendations = vi.fn();
vi.mock("./recommendations", () => ({
  getHomeRecommendations: (params: unknown) => getHomeRecommendations(params),
}));

import { useQueryHomeRecommendations } from "./use-query-home-recommendations";

afterEach(() => getHomeRecommendations.mockReset());

// 로그인 전이거나 아이가 없는 메인이 이렇게 부른다. 대기로 남으면 뼈대가 끝없이 떠 있다
test("아이가 없으면 부르지 않고 기다리는 중도 아니다", () => {
  const { result } = renderHook(() => useQueryHomeRecommendations({ petId: undefined }), {
    wrapper: createQueryWrapper(),
  });

  expect(getHomeRecommendations).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);
  expect(result.current.items).toBeUndefined();
});

test("고른 아이·분류·개수로 부르고, 받는 동안은 기다리는 중이다", async () => {
  getHomeRecommendations.mockResolvedValue([{ productId: 1 }]);
  const { result } = renderHook(
    () => useQueryHomeRecommendations({ petId: 3, category: "snack", size: 50 }),
    { wrapper: createQueryWrapper() },
  );

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  expect(getHomeRecommendations).toHaveBeenCalledWith({ petId: 3, category: "snack", size: 50 });
});

// 메인 아이 줄·추천 화면 알약에서 아이를 바꾸는 흐름이다. 키에 아이가 없으면 앞 아이의 추천·적합도가
// 캐시에서 그대로 나온다(PM QA 온보딩-메인페이지 r17·r20·r21·r32·r33)
test("아이를 바꾸면 그 아이로 다시 부르고 앞 아이의 추천을 보이지 않는다", async () => {
  getHomeRecommendations.mockImplementation(({ petId }: { petId: number }) =>
    Promise.resolve([{ productId: petId * 100 }]),
  );
  const { result, rerender } = renderHook(
    ({ petId }: { petId: number }) => useQueryHomeRecommendations({ petId, size: 9 }),
    { wrapper: createQueryWrapper(), initialProps: { petId: 3 } },
  );
  await waitFor(() => expect(result.current.items).toEqual([{ productId: 300 }]));

  rerender({ petId: 7 });

  expect(result.current.items).toBeUndefined();
  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.items).toEqual([{ productId: 700 }]));
  expect(getHomeRecommendations).toHaveBeenCalledTimes(2);
  expect(getHomeRecommendations).toHaveBeenLastCalledWith({
    petId: 7,
    category: undefined,
    size: 9,
  });
});

// 추천 칸만 오류 경계로 대체하고 같은 화면의 다른 칸은 남긴다
test("받아 둔 것 없이 실패하면 오류를 던져 감싼 경계가 받는다", async () => {
  getHomeRecommendations.mockRejectedValue(new Error("boom"));
  // React가 경계에 잡힌 오류도 콘솔에 남긴다. 기대한 실패라 출력만 막는다
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const Wrapper = createQueryWrapper();

  function Probe() {
    const { items } = useQueryHomeRecommendations({ petId: 3 });
    return <p>{items ? "받음" : "받는 중"}</p>;
  }

  render(
    <Wrapper>
      <ErrorBoundary fallback={<p role="alert">실패</p>}>
        <Probe />
      </ErrorBoundary>
    </Wrapper>,
  );

  expect(await screen.findByRole("alert")).toBeDefined();
  consoleError.mockRestore();
});
