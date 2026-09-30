// 아이 정보를 고치면 어떤 캐시를 비우는지 본다.
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createQueryClient } from "@/shared/lib/query-client";

vi.mock("./pets", () => ({ updatePet: vi.fn(async () => undefined) }));
vi.mock("@/shared/api/upload-image", () => ({ uploadImage: vi.fn() }));

import { useMutateUpdatePet } from "./use-mutate-update-pet";

// 추천은 알레르기로 감점하고 주의 문구를 싣는다. 비우지 않으면 고친 직후 옛 추천이 1분 남았다(#600)
test("아이 정보를 고치면 맞춤 추천 캐시도 비운다", async () => {
  const queryClient = createQueryClient({ retry: false });
  const recommendationKey = QUERY_KEYS.recommendation.home({ petId: 3 });
  queryClient.setQueryData(recommendationKey, { items: [] });
  const { result } = renderHook(() => useMutateUpdatePet("3"), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  await act(() => result.current.updatePet({ patch: { name: "코코" }, photo: null }));

  expect(queryClient.getQueryState(recommendationKey)?.isInvalidated).toBe(true);
});
