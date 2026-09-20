// 회원 정보 조회·수정 요청 테스트. 무엇을 부르고 무엇을 보내는지 본다.
import { afterEach, expect, test, vi } from "vitest";

import { getMyProfile, updateMyProfile, withdraw } from "./profile";

const PROFILE = {
  nickname: "신나는강아지813",
  name: null,
  birth: null,
  phone: null,
  image: null,
  email: "me@example.com",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("내 정보를 부른다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(PROFILE));
  vi.stubGlobal("fetch", fetchMock);

  const profile = await getMyProfile();

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/members/me");
  expect(profile.nickname).toBe("신나는강아지813");
});

// 닉네임만 고치는 화면이 이름·생일까지 실으면 고치지도 않은 값을 덮어쓴다
test("고칠 것만 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await updateMyProfile({ nickname: "보리맘" });

  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(init.method).toBe("PATCH");
  expect(JSON.parse(String(init.body))).toEqual({ nickname: "보리맘" });
});

test("탈퇴는 DELETE로 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await withdraw();

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/members/me");
  expect(init.method).toBe("DELETE");
});
