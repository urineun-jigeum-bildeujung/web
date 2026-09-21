// 서버 시각을 화면 형식으로. 시간대를 박지 않으면 같은 주문이 기기마다 다른 날짜로 보인다.
import { expect, test } from "vitest";

import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayDayHour,
  formatDisplayHour,
  toDisplayDayKey,
} from "./display-date";

test("시안 형식 그대로 그린다", () => {
  expect(formatDisplayDate("2026-08-28T15:43:00+09:00")).toBe("26.08.28");
  expect(formatDisplayDateTime("2026-08-28T15:43:00+09:00")).toBe("26.08.28 15:43");
});

test("한 자리 시각도 두 자리로 채운다", () => {
  expect(formatDisplayDateTime("2026-08-28T09:05:00+09:00")).toBe("26.08.28 09:05");
});

test("오후 시각을 24시간제로 그린다", () => {
  // 로캘 기본값을 따르면 `오후 03`이 나온다. `hourCycle`이 그것을 막는다
  expect(formatDisplayDateTime("2026-08-28T21:00:00+09:00")).toBe("26.08.28 21:00");
});

test("브라우저 시간대가 달라도 한국 날짜로 그린다", () => {
  const justAfterMidnight = "2026-08-28T00:30:00+09:00";

  // **이 값은 UTC로는 8월 27일이다.** 시간대를 박지 않으면 UTC 환경에서 하루 밀린다.
  // 이 단언이 있어야 아래 기대값이 우연히 맞은 것이 아님을 안다
  expect(new Date(justAfterMidnight).getUTCDate()).toBe(27);
  expect(formatDisplayDate(justAfterMidnight)).toBe("26.08.28");
});

test("날짜만 있는 값은 그 날짜 그대로다", () => {
  // UTC 자정으로 읽히지만 한국이 양수 오프셋이라 같은 날 09시가 된다
  expect(formatDisplayDate("2026-07-20")).toBe("26.07.20");
});

test("읽을 수 없는 값은 null이다", () => {
  expect(formatDisplayDate("")).toBeNull();
  expect(formatDisplayDate("어제")).toBeNull();
  expect(formatDisplayDateTime("2026-13-45T99:99:99Z")).toBeNull();
});

test("같은 날인지 견줄 하루 키를 준다", () => {
  const justAfterMidnight = "2026-09-22T00:30:00+09:00";

  // UTC로는 9월 21일이다. 브라우저 시간대로 판정하면 어제가 된다
  expect(new Date(justAfterMidnight).getUTCDate()).toBe(21);
  expect(toDisplayDayKey(justAfterMidnight)).toBe("26.09.22");
  expect(toDisplayDayKey("2026-09-22T23:59:00+09:00")).toBe("26.09.22");
  expect(toDisplayDayKey("2026-09-23T00:00:00+09:00")).toBe("26.09.23");
});

test("시각을 오전·오후로 그린다", () => {
  expect(formatDisplayHour("2026-09-25T15:00:00+09:00")).toBe("오후 3시");
  expect(formatDisplayHour("2026-09-25T09:00:00+09:00")).toBe("오전 9시");
});

test("자정과 정오를 12시로 그린다", () => {
  expect(formatDisplayHour("2026-09-25T00:30:00+09:00")).toBe("오전 12시");
  expect(formatDisplayHour("2026-09-25T12:30:00+09:00")).toBe("오후 12시");
});

test("날짜와 시각을 말하듯 붙인다", () => {
  // 앞자리 0을 떼고 읽는다 — `09월 05일`이 아니라 `9월 5일`이다
  expect(formatDisplayDayHour("2026-09-05T15:00:00+09:00")).toBe("9월 5일 오후 3시");
});

test("읽을 수 없는 값은 새 함수들도 null이다", () => {
  expect(toDisplayDayKey("곧")).toBeNull();
  expect(formatDisplayHour("곧")).toBeNull();
  expect(formatDisplayDayHour("곧")).toBeNull();
});
