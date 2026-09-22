// 브라우저 기능·Firebase 설정이 없을 때 물러나는지, 권한 결과에 따라 토큰을 받는지 본다.
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const getToken = vi.fn();
const deleteToken = vi.fn();
const onMessage = vi.fn();
// firebase 자체가 아니라 그것을 불러오는 우리 층을 바꿔 끼운다
vi.mock("./firebase-sdk", () => ({
  loadFirebase: async () => ({
    getApps: () => [],
    initializeApp: () => ({}),
    getMessaging: () => ({}),
    getToken: (...args: unknown[]) => getToken(...args),
    deleteToken: (...args: unknown[]) => deleteToken(...args),
    onMessage: (...args: unknown[]) => onMessage(...args),
  }),
}));

// 설정은 모듈을 읽는 순간 고정되므로 import 전에 채운다
vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "k");
vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "d");
vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "p");
vi.stubEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "b");
vi.stubEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "s");
vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "a");
vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "vapid");

const { deletePushToken, isPushSupported, requestPushToken, subscribePushMessages } =
  await import("./fcm");

const register = vi.fn();
const requestPermission = vi.fn();

/** jsdom에는 알림·푸시가 없다. 브라우저 셋을 흉내 낸다 */
function stubBrowserPush(permission: NotificationPermission) {
  requestPermission.mockResolvedValue(permission);
  vi.stubGlobal("Notification", { permission, requestPermission });
  vi.stubGlobal("PushManager", function PushManager() {});
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: register.mockResolvedValue({ scope: "/" }) },
  });
}

beforeEach(() => {
  getToken.mockReset().mockResolvedValue("fcm-token-1");
  deleteToken.mockReset().mockResolvedValue(true);
  onMessage.mockReset().mockReturnValue(() => {});
  register.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

test("알림 API가 없는 환경은 지원하지 않는다고 답하고 아무것도 부르지 않는다", async () => {
  expect(isPushSupported()).toBe(false);
  await expect(requestPushToken()).resolves.toEqual({ status: "unsupported" });
  await deletePushToken();
  expect(getToken).not.toHaveBeenCalled();
  expect(deleteToken).not.toHaveBeenCalled();
});

test("권한을 거부하면 토큰을 받지 않는다", async () => {
  stubBrowserPush("denied");

  await expect(requestPushToken()).resolves.toEqual({ status: "denied" });
  expect(register).not.toHaveBeenCalled();
  expect(getToken).not.toHaveBeenCalled();
});

test("권한을 허용하면 우리 서비스 워커와 VAPID 키로 토큰을 받는다", async () => {
  stubBrowserPush("granted");

  await expect(requestPushToken()).resolves.toEqual({ status: "granted", token: "fcm-token-1" });
  expect(register).toHaveBeenCalledWith("/firebase-messaging-sw.js");
  expect(getToken).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ vapidKey: "vapid", serviceWorkerRegistration: { scope: "/" } }),
  );
});

test("끄면 이 기기의 토큰을 지운다", async () => {
  stubBrowserPush("granted");

  await deletePushToken();
  expect(deleteToken).toHaveBeenCalledTimes(1);
});

test("포그라운드 푸시는 제목과 본문만 뽑아 넘기고, 돌려준 함수로 구독을 끊는다", async () => {
  stubBrowserPush("granted");
  const off = vi.fn();
  onMessage.mockReturnValue(off);
  const handler = vi.fn();

  const unsubscribe = await subscribePushMessages(handler);
  const listener = onMessage.mock.calls[0][1] as (payload: unknown) => void;
  listener({ notification: { title: "테스트", body: "본문" }, data: { targetType: "ORDER" } });
  unsubscribe();

  expect(handler).toHaveBeenCalledWith({ title: "테스트", body: "본문" });
  expect(off).toHaveBeenCalledTimes(1);
});
