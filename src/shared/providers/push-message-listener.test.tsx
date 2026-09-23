// 켜진 기기에서만 구독하는지, 온 푸시로 알림 캐시를 비우는지(토스트는 폴링 토스터 몫) 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { QUERY_KEYS } from "@/shared/config/query-keys";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const push = { granted: true, subscribe: vi.fn(), unsubscribe: vi.fn() };
vi.mock("@/shared/lib/push/fcm", () => ({
  isPushPermissionGranted: () => push.granted,
  subscribePushMessages: (handler: unknown) => push.subscribe(handler),
}));

import { PushMessageListener } from "./push-message-listener";

beforeEach(() => {
  push.granted = true;
  push.unsubscribe.mockReset();
  push.subscribe.mockReset().mockResolvedValue(push.unsubscribe);
});

afterEach(() => {
  window.localStorage.clear();
});

test("푸시를 켜 두지 않은 기기에서는 구독하지 않는다", () => {
  render(<PushMessageListener />, { wrapper: createQueryWrapper() });
  expect(push.subscribe).not.toHaveBeenCalled();
});

test("켜 둔 기기에서는 온 푸시로 알림 캐시를 비우고, 내려가면 구독을 끊는다", async () => {
  window.localStorage.setItem("push-enabled", "1");
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(QUERY_KEYS.notification.list(), []);
  const view = render(
    <QueryClientProvider client={queryClient}>
      <PushMessageListener />
    </QueryClientProvider>,
  );

  await waitFor(() => expect(push.subscribe).toHaveBeenCalledTimes(1));
  const handler = push.subscribe.mock.calls[0][0] as (message: {
    title?: string;
    body?: string;
  }) => void;
  handler({ title: "골라주개냥 테스트 알림", body: "본문" });
  // 토스트는 폴링 토스터 몫이다. 여기서는 캐시만 비워 그쪽이 새 알림을 보게 한다
  expect(queryClient.getQueryState(QUERY_KEYS.notification.list())?.isInvalidated).toBe(true);

  view.unmount();
  expect(push.unsubscribe).toHaveBeenCalledTimes(1);
});

// 앱(웹뷰) 안에서는 브라우저 권한이 없어도 앱이 대신 받아 준다(#403).
// 스위치를 꺼도 앱 토큰은 서버에 남아 신호가 오므로, 꺼진 채로도 종의 점·알림함은 갱신돼야 한다
test("앱이 보낸 수신 신호로는 스위치가 꺼져 있어도 알림 캐시를 비운다", () => {
  push.granted = false;
  window.golajuNative = { pushSupported: true };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(QUERY_KEYS.notification.list(), []);
  const view = render(
    <QueryClientProvider client={queryClient}>
      <PushMessageListener />
    </QueryClientProvider>,
  );

  window.dispatchEvent(new CustomEvent("golaju:push-received"));
  expect(queryClient.getQueryState(QUERY_KEYS.notification.list())?.isInvalidated).toBe(true);
  // 브라우저 푸시 구독은 스위치를 켜야 건다
  expect(push.subscribe).not.toHaveBeenCalled();

  view.unmount();
  delete window.golajuNative;
});
