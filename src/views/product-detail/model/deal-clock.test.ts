// 타임딜 종료 시각을 기기 시계로 옮기는 계산이 기기 시계 차이와 뒤로가기 캐시를 견디는지 본다
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { toDeviceEndsAt } from "./deal-clock";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// 서버가 12시에 만든 응답이고 딜은 14시에 끝난다. 남은 시간은 서버 기준 2시간이다
const SERVER_TIME = "2026-09-29T12:00:00+09:00";
const END_AT = "2026-09-29T14:00:00+09:00";

it("기기 시계가 서버보다 1시간 빨라도 남은 시간은 서버 기준 그대로다", () => {
  const deviceNow = Date.parse("2026-09-29T13:00:00+09:00");
  vi.setSystemTime(deviceNow);

  const endsAt = toDeviceEndsAt(END_AT, SERVER_TIME);

  // 기기 시계로 그대로 세면 1시간만 남아 딜이 서버보다 일찍 끝난다
  expect(endsAt.getTime() - deviceNow).toBe(2 * 3_600_000);
});

// 뒤로가기는 캐시된 응답(옛 serverTime)으로 화면을 다시 그린다. 그때의 지금 시각으로 다시 재면
// 캐시에 머문 10분만큼 종료가 늦춰져 끝난 딜에 구매 버튼이 남는다
it("같은 응답을 나중에 다시 그려도 처음 본 시각 기준의 종료 시각을 준다", () => {
  const serverTime = "2026-09-29T12:00:00.000001+09:00";
  const firstSeen = Date.parse("2026-09-29T12:00:01+09:00");
  vi.setSystemTime(firstSeen);
  const first = toDeviceEndsAt(END_AT, serverTime);

  vi.setSystemTime(firstSeen + 10 * 60_000);
  const again = toDeviceEndsAt(END_AT, serverTime);

  expect(again.getTime()).toBe(first.getTime());
});

it("서버에서 그릴 때는 옮기지도 기억하지도 않는다", () => {
  const serverTime = "2026-09-29T12:00:00.000002+09:00";
  vi.stubGlobal("window", undefined);
  vi.setSystemTime(Date.parse("2026-09-29T15:00:00+09:00"));

  expect(toDeviceEndsAt(END_AT, serverTime).getTime()).toBe(Date.parse(END_AT));

  // 서버에서 본 시각을 기억했다면 기기에서도 그 시각(15시) 기준으로 옮겨진다
  vi.unstubAllGlobals();
  const deviceNow = Date.parse("2026-09-29T12:00:05+09:00");
  vi.setSystemTime(deviceNow);
  expect(toDeviceEndsAt(END_AT, serverTime).getTime() - deviceNow).toBe(2 * 3_600_000);
});
