// 타임딜 알림 구독 조회·변경 훅 테스트. 서버에 무엇을 보내는지와 두 화면이 같은 값을 보는지를 본다.
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const session = { value: true };
vi.mock("@/shared/api/use-has-session", () => ({ useHasSession: () => session.value }));

import { useMutateTimeDealSubscription } from "./use-mutate-time-deal-subscription";
import { useQueryTimeDealSubscription } from "./use-query-time-deal-subscription";

/** 서버가 기억하는 구독 값을 흉내 낸다. PUT이 바꾸고 GET이 돌려준다 */
function stubSubscriptionServer(initial: boolean) {
  let subscribed = initial;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    expect(url).toMatch(/\/notifications\/subscriptions\/TIME_DEAL$/);
    if (init?.method === "PUT") {
      subscribed = (JSON.parse(String(init.body)) as { subscribed: boolean }).subscribed;
    }
    return Response.json({ category: "TIME_DEAL", subscribed });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function useBoth() {
  return { query: useQueryTimeDealSubscription(), mutation: useMutateTimeDealSubscription() };
}

describe("타임딜 알림 구독", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    session.value = true;
  });

  it("로그인했으면 서버의 구독 여부를 받는다", async () => {
    stubSubscriptionServer(true);

    const { result } = renderHook(useQueryTimeDealSubscription, { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.subscribed).toBe(true));
  });

  it("비로그인이면 묻지 않고 구독하지 않은 것으로 본다", () => {
    session.value = false;
    const fetchMock = stubSubscriptionServer(true);

    const { result } = renderHook(useQueryTimeDealSubscription, { wrapper: createQueryWrapper() });

    expect(result.current.subscribed).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("켜면 PUT으로 subscribed를 보내고, 같은 캐시를 보는 조회도 곧바로 켜진다", async () => {
    const fetchMock = stubSubscriptionServer(false);
    const { result } = renderHook(useBoth, { wrapper: createQueryWrapper() });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => result.current.mutation.setSubscribed(true));

    await waitFor(() => expect(result.current.query.subscribed).toBe(true));
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(JSON.stringify({ subscribed: true }));
  });

  it("저장에 실패하면 구독 값을 바꾸지 않는다", async () => {
    const fetchMock = stubSubscriptionServer(false);
    const { result } = renderHook(useBoth, { wrapper: createQueryWrapper() });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    act(() => result.current.mutation.setSubscribed(true));

    await waitFor(() => expect(result.current.mutation.isPending).toBe(false));
    expect(result.current.query.subscribed).toBe(false);
  });
});
