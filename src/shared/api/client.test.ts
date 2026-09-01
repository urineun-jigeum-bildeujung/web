// apiRequest 공통 fetch 래퍼 단위 테스트. 헤더 조립·성공 파싱·실패 throw를 검증한다.
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "./client";

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

  it("실패 응답이면 상태 코드를 담은 ApiError를 던진다", async () => {
    stubFetch(new Response(null, { status: 404 }));

    const request = apiRequest("/products/999");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 404 });
  });

  it("204 응답은 본문 파싱 없이 끝낸다", async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(apiRequest("/notifications/read-all")).resolves.toBeUndefined();
  });
});
