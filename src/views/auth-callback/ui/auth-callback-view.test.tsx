// 소셜 인증 복귀 테스트. 교환이 한 번만 나가는지, 실패 갈래마다 다음 행동이 있는지 본다.
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const replace = vi.fn();
let query = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => query,
}));

import { clearTokens, getAccessToken, getRefreshToken } from "@/shared/api/token-store";

import { AuthCallbackView } from "./auth-callback-view";

/** 교환 응답 한 벌. 백엔드 `LoginCodePayload`와 같은 모양이다 */
function exchangeResponse(needsSignup: boolean) {
  return Response.json({
    accessToken: "access-1",
    refreshToken: "refresh-1",
    nickname: "졸린고양이 17",
    needsSignup,
  });
}

beforeEach(() => {
  query = new URLSearchParams("code=one-time-code");
  replace.mockClear();
  clearTokens();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("code를 교환해 토큰을 보관한다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(exchangeResponse(false)));

  render(<AuthCallbackView />);

  await waitFor(() => expect(getAccessToken()).toBe("access-1"));
  expect(getRefreshToken()).toBe("refresh-1");
});

test("교환 요청은 code만 본문에 싣고 Authorization을 붙이지 않는다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(exchangeResponse(false));
  vi.stubGlobal("fetch", fetchMock);

  render(<AuthCallbackView />);

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/auths/token/exchange");
  expect(init.body).toBe(JSON.stringify({ code: "one-time-code" }));
  expect(new Headers(init.headers).has("Authorization")).toBe(false);
});

// 가입을 안 끝낸 사람은 신규가 아니어도 가입 화면으로 가야 한다
test("needsSignup이면 추천 닉네임과 함께 가입 화면으로 보낸다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(exchangeResponse(true)));

  render(<AuthCallbackView />);

  await waitFor(() =>
    expect(replace).toHaveBeenCalledWith(`/signup?nickname=${encodeURIComponent("졸린고양이 17")}`),
  );
});

test("가입을 마친 사람은 홈으로 보낸다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(exchangeResponse(false)));

  render(<AuthCallbackView />);

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
});

// code는 일회용이라 두 번째 호출은 400이다. 성공한 로그인이 실패로 보이면 안 된다
test("effect가 두 번 불려도 교환은 한 번만 나간다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(exchangeResponse(false));
  vi.stubGlobal("fetch", fetchMock);

  const { rerender } = render(<AuthCallbackView />);
  rerender(<AuthCallbackView />);

  await waitFor(() => expect(replace).toHaveBeenCalled());
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("백엔드가 실패를 알리면 교환하지 않고 안내한다", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  query = new URLSearchParams("error=login_failed");

  render(<AuthCallbackView />);

  expect(await screen.findByRole("heading", { name: "로그인 실패" })).toBeDefined();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("code 없이 들어오면 안내한다", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  query = new URLSearchParams();

  render(<AuthCallbackView />);

  expect(await screen.findByRole("heading", { name: "로그인 실패" })).toBeDefined();
  expect(fetchMock).not.toHaveBeenCalled();
});

// 만료된 code로 새로고침한 경우다. 백엔드 errorCode에 맞는 문구가 나와야 한다
test("교환이 실패하면 응답 문구로 안내하고 로그인으로 돌아갈 길을 준다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      // 백엔드 `AuthErrorCode.INVALID_LOGIN_CODE`가 내는 실제 코드다. 그전 목의 `AUTH_400`은
      // 어디에도 없는 키라 매핑이 안 걸리는 것을 가리고 있었다 (#310)
      Response.json(
        { errorCode: "AUTH_400_INVALID_LOGIN_CODE", detail: "만료된 코드" },
        { status: 400 },
      ),
    ),
  );

  render(<AuthCallbackView />);

  expect(await screen.findByRole("heading", { name: "로그인 실패" })).toBeDefined();
  expect(screen.getByRole("button", { name: "로그인으로 돌아가기" })).toBeDefined();
  expect(replace).not.toHaveBeenCalled();
});

test("교환 중에는 진행 중임을 알린다", () => {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

  render(<AuthCallbackView />);

  expect(screen.getByRole("status").textContent).toBe("로그인하는 중이에요");
});
