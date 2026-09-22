// FCM 토큰 등록 요청이 무엇을 어디로 보내는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { registerFcmToken } from "./fcm-tokens";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("토큰을 본문에 실어 등록 주소로 POST한다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(registerFcmToken("fcm-token-1")).resolves.toBeUndefined();

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/notifications/fcm-tokens");
  expect(init.method).toBe("POST");
  expect(JSON.parse(String(init.body))).toEqual({ token: "fcm-token-1" });
});
