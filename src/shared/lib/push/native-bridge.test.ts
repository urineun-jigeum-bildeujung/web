// 앱이 없으면 물러나는지, 앱의 토큰·거부 답과 무응답을 결과로 바꾸는지, 수신 신호를 듣는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import {
  isNativeApp,
  isNativePushSupported,
  requestNativePushToken,
  subscribeNativePushReceived,
} from "./native-bridge";

const postMessage = vi.fn();

function mountNativeApp(pushSupported = true) {
  window.golajuNative = { pushSupported };
  window.ReactNativeWebView = { postMessage };
}

afterEach(() => {
  delete window.golajuNative;
  delete window.ReactNativeWebView;
  postMessage.mockClear();
  vi.useRealTimers();
});

test("앱이 없거나 푸시를 못 받는 앱이면 지원하지 않는다", async () => {
  expect(isNativeApp()).toBe(false);
  expect(isNativePushSupported()).toBe(false);
  await expect(requestNativePushToken()).resolves.toEqual({ status: "unsupported" });

  // iOS 앱. 앱이긴 하지만 토큰은 못 받는다
  mountNativeApp(false);
  expect(isNativeApp()).toBe(true);
  expect(isNativePushSupported()).toBe(false);
  await expect(requestNativePushToken()).resolves.toEqual({ status: "unsupported" });
});

test("앱에 요청하고 토큰 답을 받으면 허용으로 돌려준다", async () => {
  mountNativeApp();
  const pending = requestNativePushToken();

  expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: "golaju:request-push-token" }));
  window.dispatchEvent(new CustomEvent("golaju:push-token", { detail: "fcm-token" }));

  await expect(pending).resolves.toEqual({ status: "granted", token: "fcm-token" });
});

test("거부 답이나 빈 토큰은 거부로 돌려준다", async () => {
  mountNativeApp();
  const denied = requestNativePushToken();
  window.dispatchEvent(new CustomEvent("golaju:push-denied"));
  await expect(denied).resolves.toEqual({ status: "denied" });

  const empty = requestNativePushToken();
  window.dispatchEvent(new CustomEvent("golaju:push-token", { detail: "" }));
  await expect(empty).resolves.toEqual({ status: "denied" });
});

test("앱이 답하지 않으면 거부로 본다", async () => {
  vi.useFakeTimers();
  mountNativeApp();
  const pending = requestNativePushToken();

  await vi.advanceTimersByTimeAsync(120_000);

  await expect(pending).resolves.toEqual({ status: "denied" });
});

test("수신 신호를 듣고 끊는다", () => {
  mountNativeApp();
  const listener = vi.fn();
  const unsubscribe = subscribeNativePushReceived(listener);

  window.dispatchEvent(new CustomEvent("golaju:push-received"));
  expect(listener).toHaveBeenCalledTimes(1);

  unsubscribe();
  window.dispatchEvent(new CustomEvent("golaju:push-received"));
  expect(listener).toHaveBeenCalledTimes(1);
});
