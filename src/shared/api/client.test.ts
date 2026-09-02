// apiRequest 공통 fetch 래퍼 단위 테스트. 헤더 조립·성공 파싱·실패 throw·401 재발급을 검증한다.
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "./client";
import { clearTokens, getRefreshToken, saveTokens } from "./token-store";

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("성공 응답의 JSON 본문을 돌려준다", async () => {
    stubFetch(Response.json({ id: 1 }));

    await expect(apiRequest<{ id: number }>("/products/1")).resolves.toEqual({ id: 1 });
  });

  it("body가 있으면 JSON으로 직렬화하고 Content-Type을 붙인다", async () => {
    const fetchMock = stubFetch(Response.json({ ok: true }));

    await apiRequest("/cart/items", { method: "POST", body: { productId: 1 } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ productId: 1 }));
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("실패 응답의 ProblemDetail을 파싱해 ApiError에 담는다", async () => {
    const problem = {
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "상품을 찾을 수 없습니다",
      instance: "/api/v1/products/999",
    };
    stubFetch(Response.json(problem, { status: 404 }));

    const request = apiRequest("/products/999");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 404,
      message: "상품을 찾을 수 없습니다",
      problem,
    });
  });

  it("본문이 ProblemDetail이 아니어도 상태 코드를 담은 ApiError를 던진다", async () => {
    stubFetch(new Response("Bad Gateway", { status: 502 }));

    const request = apiRequest("/products/999");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 502, problem: undefined });
  });

  it("204 응답은 본문 파싱 없이 끝낸다", async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(apiRequest("/notifications/read-all")).resolves.toBeUndefined();
  });
});

describe("apiRequest 인증", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearTokens();
  });

  function stubAuthFetch() {
    // 만료 토큰이면 401, 재발급 경로면 새 토큰 쌍, 새 토큰이면 성공을 돌려주는 백엔드 흉내
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/auths/token/refresh")) {
        return Response.json({ accessToken: "access-2", refreshToken: "refresh-2" });
      }
      const auth = new Headers(init?.headers).get("Authorization");
      if (auth === "Bearer access-2") {
        return Response.json({ ok: true });
      }
      return new Response(null, { status: 401 });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("accessToken이 있으면 Authorization Bearer 헤더를 붙인다", async () => {
    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });
    const fetchMock = stubFetch(Response.json({}));

    await apiRequest("/users/me");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access-1");
  });

  it("401이면 재발급 뒤 새 토큰으로 원 요청을 한 번 다시 보낸다", async () => {
    saveTokens({ accessToken: "expired", refreshToken: "refresh-1" });
    const fetchMock = stubAuthFetch();

    await expect(apiRequest("/users/me")).resolves.toEqual({ ok: true });

    const refreshCall = fetchMock.mock.calls.find(([url]) =>
      (url as string).endsWith("/auths/token/refresh"),
    ) as [string, RequestInit];
    expect(refreshCall[1].body).toBe(JSON.stringify({ refreshToken: "refresh-1" }));
    expect(getRefreshToken()).toBe("refresh-2");
  });

  it("동시에 여러 요청이 401을 받아도 재발급은 한 번만 호출된다", async () => {
    saveTokens({ accessToken: "expired", refreshToken: "refresh-1" });
    const fetchMock = stubAuthFetch();

    await Promise.all([apiRequest("/cart"), apiRequest("/orders"), apiRequest("/users/me")]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      (url as string).endsWith("/auths/token/refresh"),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it("재발급도 실패하면 토큰을 지우고 원래 401 에러를 던진다", async () => {
    saveTokens({ accessToken: "expired", refreshToken: "rotated-old" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    const request = apiRequest("/users/me");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(getRefreshToken()).toBeNull();
    // 원 요청 1회 + 재발급 1회. 재발급 실패 후 원 요청을 다시 보내지 않는다.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refreshToken이 없으면 재발급 시도 없이 401을 그대로 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/users/me")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
