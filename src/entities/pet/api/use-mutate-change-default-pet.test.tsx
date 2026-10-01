// 기본 아이를 바꾸면 어떤 요청을 보내고 어떤 캐시를 비우는지 본다 (#531).
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createQueryClient } from "@/shared/lib/query-client";

const changeDefaultPet = vi.fn<(petId: string) => Promise<void>>(async () => undefined);
vi.mock("./pets", () => ({ changeDefaultPet: (petId: string) => changeDefaultPet(petId) }));

import { useMutateChangeDefaultPet } from "./use-mutate-change-default-pet";

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
