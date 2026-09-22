// 설정 테스트. 알림 스위치(권한·토큰 등록·끄기), 계정 항목, 로그아웃을 검증한다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const toastAppError = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
}));

// 브라우저 권한·Firebase는 `shared/lib/push/fcm.test.ts`가 본다. 여기서는 결과만 세운다
const push = {
  supported: true,
  granted: false,
  requestPushToken: vi.fn(),
  deletePushToken: vi.fn(),
};
vi.mock("@/shared/lib/push/fcm", () => ({
  isPushSupported: () => push.supported,
  isPushPermissionGranted: () => push.granted,
  requestPushToken: () => push.requestPushToken(),
  deletePushToken: () => push.deletePushToken(),
}));

import { hasSession, saveTokens } from "@/shared/api/token-store";

import { SettingsView } from "./settings-view";

function renderView() {
  return render(<SettingsView />, { wrapper: createQueryWrapper() });
}

beforeEach(() => {
  toastAppError.mockClear();
  push.supported = true;
  push.granted = false;
  push.requestPushToken.mockReset().mockResolvedValue({ status: "granted", token: "fcm-token-1" });
  push.deletePushToken.mockReset().mockResolvedValue(undefined);
  saveTokens({ accessToken: "a", refreshToken: "r" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test("알림설정에 스위치가 있고 처음에는 꺼져 있다", () => {
  renderView();
  expect(screen.getByRole("switch", { name: "알림설정" }).getAttribute("aria-checked")).toBe(
    "false",
  );
});

test("스위치를 켜면 권한을 묻고 받은 토큰을 서버에 등록한 뒤 켜진다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.click(screen.getByRole("switch", { name: "알림설정" }));
  // 등록이 끝나면 저장된 표시와 허용된 권한이 함께 있어야 켜짐이다
  push.granted = true;

  await waitFor(() =>
    expect(screen.getByRole("switch", { name: "알림설정" }).getAttribute("aria-checked")).toBe(
      "true",
    ),
  );
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/notifications/fcm-tokens");
  expect(init.method).toBe("POST");
  expect(JSON.parse(String(init.body))).toEqual({ token: "fcm-token-1" });
});

// 권한은 브라우저가 쥐고 있다. 거부하면 켜 줄 수 없고 어디서 푸는지 알려야 한다
test("권한을 거부하면 켜지지 않고 그 까닭을 알린다", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  push.requestPushToken.mockResolvedValue({ status: "denied" });
  renderView();

  fireEvent.click(screen.getByRole("switch", { name: "알림설정" }));

  await waitFor(() =>
    expect(toastAppError).toHaveBeenCalledWith("notification.pushPermissionDenied"),
  );
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByRole("switch", { name: "알림설정" }).getAttribute("aria-checked")).toBe(
    "false",
  );
});

test("켜져 있던 스위치를 끄면 이 기기의 토큰을 지우고 꺼진다", async () => {
  window.localStorage.setItem("push-enabled", "1");
  push.granted = true;
  renderView();
  expect(screen.getByRole("switch", { name: "알림설정" }).getAttribute("aria-checked")).toBe(
    "true",
  );

  fireEvent.click(screen.getByRole("switch", { name: "알림설정" }));

  await waitFor(() => expect(push.deletePushToken).toHaveBeenCalled());
  await waitFor(() =>
    expect(screen.getByRole("switch", { name: "알림설정" }).getAttribute("aria-checked")).toBe(
      "false",
    ),
  );
  expect(window.localStorage.getItem("push-enabled")).toBeNull();
});

// 표시 없이 서버에만 토큰이 남으면 화면은 꺼짐인데 푸시는 온다. 저장이 막히면 토큰을 되돌린다
test("켰다는 표시를 저장하지 못하면 등록한 토큰을 지우고 꺼진 채로 둔다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("QuotaExceededError");
  });
  renderView();

  fireEvent.click(screen.getByRole("switch", { name: "알림설정" }));

  await waitFor(() => expect(push.deletePushToken).toHaveBeenCalled());
  expect(screen.getByRole("switch", { name: "알림설정" }).getAttribute("aria-checked")).toBe(
    "false",
  );
  setItem.mockRestore();
});

test("푸시를 받을 수 없는 환경이면 스위치를 잠그고 까닭을 보인다", () => {
  push.supported = false;
  renderView();

  expect(screen.getByRole("switch", { name: /알림설정/ }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByText("이 환경에서는 켤 수 없어요")).toBeDefined();
});

test("테마설정은 자리만 있고 아직 누를 수 없다", () => {
  renderView();

  // 이어질 동작이 정해지지 않아 표시용 줄로 둔다. 누를 수 있게 두면 눌렀을 때
  // 아무 일도 없어 고장으로 읽힌다
  expect(screen.getByText("테마설정")).toBeDefined();
  expect(screen.queryByRole("button", { name: /테마설정/ })).toBeNull();
});

// 탈퇴는 되돌릴 수 없다. 바로 보내면 잘못 누른 사람이 계정을 잃는다
test("회원탈퇴는 한 번 묻고 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.click(screen.getByRole("button", { name: /회원탈퇴/ }));
  expect(fetchMock).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

  await waitFor(() => expect(hasSession()).toBe(false));
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/members/me");
  expect(init.method).toBe("DELETE");
});

// 계정이 살아 있는데 토큰만 비우면 쫓겨난 채로 탈퇴됐는지도 알 수 없다. 로그아웃과 다르다
test("탈퇴에 실패하면 기기의 토큰을 지우지 않는다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
  renderView();

  fireEvent.click(screen.getByRole("button", { name: /회원탈퇴/ }));
  fireEvent.click(screen.getByRole("button", { name: "탈퇴하기" }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(hasSession()).toBe(true);
});

// 기기에서만 지우면 서버의 refreshToken이 살아 있어 그것을 쥔 쪽이 계속 재발급을 받는다
test("로그아웃을 누르면 서버에 알리고 토큰을 지운다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

  await waitFor(() => expect(hasSession()).toBe(false));
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/auths/logout");
  expect(init.method).toBe("POST");
});

// 서버 정리에 실패했다고 로그아웃을 막으면 남의 기기에서 빠져나올 방법이 없어진다
test("서버 정리에 실패해도 기기의 토큰은 지운다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
  renderView();

  fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(hasSession()).toBe(false);
});
