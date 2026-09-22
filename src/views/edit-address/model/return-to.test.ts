// 돌아갈 곳 판정 테스트.
//
// **바깥으로 내보내지 않는 것이 핵심이다.** 주소창에 실려 오는 값이라 손으로 고칠 수 있고,
// 그대로 믿으면 저장을 마친 사용자가 남의 사이트로 간다 (#369).

import { expect, test } from "vitest";

import { toInternalPath } from "./return-to";

test("우리 경로는 그대로 돌려준다", () => {
  expect(toInternalPath("/mypage/address")).toBe("/mypage/address");
  expect(toInternalPath("/payment?items=NORMAL%3A1")).toBe("/payment?items=NORMAL%3A1");
});

test("값이 없으면 없는 것으로 다룬다", () => {
  expect(toInternalPath(null)).toBeNull();
  expect(toInternalPath("")).toBeNull();
});

// 바깥으로 나가는 모양들이다. `//`와 `/\`는 프로토콜 상대 주소로 읽혀 `/`로 시작해도 나간다
test("바깥을 가리키면 쓰지 않는다", () => {
  for (const outside of [
    "https://evil.example",
    "//evil.example",
    String.raw`/\evil.example`,
    "mypage/address",
    "javascript:alert(1)",
  ]) {
    expect(toInternalPath(outside)).toBeNull();
  }
});

// 브라우저가 주소를 읽기 전에 탭·줄바꿈을 지운다. 지우고 나면 `//evil.example`이다
test("탭과 줄바꿈으로 감춘 것도 막는다", () => {
  expect(toInternalPath("/\t/evil.example")).toBeNull();
  expect(toInternalPath("/\n/evil.example")).toBeNull();
});
