// 켜진 기기에서만 구독하는지, 온 푸시를 토스트로 알리고 알림 캐시를 비우는지 본다.
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const toastPushMessage = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastPushMessage: (...args: unknown[]) => toastPushMessage(...args),
}));

const push = { granted: true, subscribe: vi.fn(), unsubscribe: vi.fn() };
vi.mock("@/shared/lib/push/fcm", () => ({
  isPushPermissionGranted: () => push.granted,
  subscribePushMessages: (handler: unknown) => push.subscribe(handler),
}));

import { PushMessageListener } from "./push-message-listener";

beforeEach(() => {
  toastPushMessage.mockClear();
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

test("켜 둔 기기에서는 온 푸시를 토스트로 알리고, 내려가면 구독을 끊는다", async () => {
  window.localStorage.setItem("push-enabled", "1");
  const view = render(<PushMessageListener />, { wrapper: createQueryWrapper() });

  await waitFor(() => expect(push.subscribe).toHaveBeenCalledTimes(1));
  const handler = push.subscribe.mock.calls[0][0] as (message: {
    title?: string;
    body?: string;
  }) => void;
  handler({ title: "골라주개냥 테스트 알림", body: "본문" });
  expect(toastPushMessage).toHaveBeenCalledWith("골라주개냥 테스트 알림", "본문");

  view.unmount();
  expect(push.unsubscribe).toHaveBeenCalledTimes(1);
});
