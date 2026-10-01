// 기본 아이를 바꾸면 어떤 요청을 보내고 어떤 캐시를 비우는지 본다 (#531).
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createQueryClient } from "@/shared/lib/query-client";

const changeDefaultPet = vi.fn<(petId: string) => Promise<void>>(async () => undefined);
vi.mock("./pets", () => ({ changeDefaultPet: (petId: string) => changeDefaultPet(petId) }));

import { useMutateChangeDefaultPet } from "./use-mutate-change-default-pet";

afterEach(() => {
  changeDefaultPet.mockReset();
  changeDefaultPet.mockImplementation(async () => undefined);
});

function setup() {
  const queryClient = createQueryClient({ retry: false });
  const { result } = renderHook(() => useMutateChangeDefaultPet(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { queryClient, result };
}

// 목록은 기본 아이를 앞으로 세운다. 비우지 않으면 고른 아이가 줄 맨 앞으로 오지 않는다(HM-022)
test("바꾸면 그 아이로 요청하고 아이 목록과 상세를 비운다", async () => {
  const { queryClient, result } = setup();
  queryClient.setQueryData(QUERY_KEYS.pet.list(), []);
  queryClient.setQueryData(QUERY_KEYS.pet.detail("7"), {});

  await act(() => result.current.changeDefaultPet("7"));

  expect(changeDefaultPet).toHaveBeenCalledWith("7");
  expect(queryClient.getQueryState(QUERY_KEYS.pet.list())?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(QUERY_KEYS.pet.detail("7"))?.isInvalidated).toBe(true);
});

test("실패하면 목록을 비우지 않는다", async () => {
  const { queryClient, result } = setup();
  queryClient.setQueryData(QUERY_KEYS.pet.list(), []);
  changeDefaultPet.mockRejectedValueOnce(new Error("boom"));

  await act(() => result.current.changeDefaultPet("7").catch(() => undefined));

  expect(queryClient.getQueryState(QUERY_KEYS.pet.list())?.isInvalidated).toBe(false);
});

// 함께 나가면 늦게 끝난 앞 요청이 서버 기본 아이를 덮어쓴다. 누른 순서대로 하나씩 보낸다(#531 리뷰)
test("앞 요청이 끝나기 전에는 다음 요청을 보내지 않는다", async () => {
  const { result } = setup();
  let finishFirst = () => {};
  changeDefaultPet.mockImplementationOnce(
    () => new Promise<void>((resolve) => (finishFirst = resolve)),
  );

  let first: Promise<void> = Promise.resolve();
  let second: Promise<void> = Promise.resolve();
  act(() => {
    first = result.current.changeDefaultPet("7");
    second = result.current.changeDefaultPet("3");
  });
  await waitFor(() => expect(changeDefaultPet).toHaveBeenCalledTimes(1));
  expect(changeDefaultPet).toHaveBeenLastCalledWith("7");

  await act(async () => {
    finishFirst();
    await first;
    await second;
  });

  expect(changeDefaultPet.mock.calls).toEqual([["7"], ["3"]]);
});
