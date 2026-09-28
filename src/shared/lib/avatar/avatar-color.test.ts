// 아바타 배경색이 공식(H 랜덤 · S 30 · B 100 = hsl(H, 100%, 85%))을 지키는지,
// 같은 식별자가 늘 같은 색인지 본다.
import { expect, test } from "vitest";

import { avatarColor } from "./avatar-color";

/** `hsl(233, 100%, 85%)`에서 233을 꺼낸다 */
function hueOf(color: string): number {
  const match = /^hsl\((\d+), 100%, 85%\)$/.exec(color);
  if (!match) throw new Error(`공식과 다른 색이다: ${color}`);
  return Number(match[1]);
}

test("채도와 명도는 공식대로 고정이고 H만 바뀐다", () => {
  expect(avatarColor("1")).toMatch(/^hsl\(\d+, 100%, 85%\)$/);
  expect(avatarColor("코코")).toMatch(/^hsl\(\d+, 100%, 85%\)$/);
});

test("같은 식별자는 늘 같은 색이다", () => {
  expect(avatarColor("42")).toBe(avatarColor("42"));
  expect(avatarColor("코코")).toBe(avatarColor("코코"));
});

test("H는 0~359 안에 있다", () => {
  for (let id = 0; id < 500; id += 1) {
    const hue = hueOf(avatarColor(String(id)));
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  }
});

// 서버 id는 이어지는 숫자다. 1°만 달라지면 두 아이가 같은 색으로 보인다
test("이어지는 숫자 식별자끼리 색이 뚜렷이 벌어진다", () => {
  for (let id = 1; id < 200; id += 1) {
    const gap = Math.abs(hueOf(avatarColor(String(id + 1))) - hueOf(avatarColor(String(id))));
    expect(Math.min(gap, 360 - gap)).toBeGreaterThan(20);
  }
});

test("빈 문자열과 아주 긴 식별자에서도 공식대로 나온다", () => {
  expect(avatarColor("")).toMatch(/^hsl\(\d+, 100%, 85%\)$/);
  expect(avatarColor("a".repeat(500))).toMatch(/^hsl\(\d+, 100%, 85%\)$/);
});
