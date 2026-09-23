// 수거 희망일 보기 테스트. 한국 날짜로 내일부터 세는지, 일요일을 건너뛰는지 본다.
import { expect, test } from "vitest";

import { pickupDateOptions } from "./pickup-dates";

test("내일과 모레를 시안 모양으로 준다", () => {
  // 2026-09-23(수) 한국 오후 3시
  const options = pickupDateOptions(new Date("2026-09-23T15:00:00+09:00"));

  expect(options).toEqual([
    { value: "2026-09-24", label: "9/24(목)" },
    { value: "2026-09-25", label: "9/25(금)" },
  ]);
});

// UTC로는 아직 22일이지만 한국은 이미 23일이다. "내일"은 한국의 24일이어야 한다
test("날짜는 한국 시각으로 센다", () => {
  const options = pickupDateOptions(new Date("2026-09-22T16:30:00Z"));

  expect(options[0]).toEqual({ value: "2026-09-24", label: "9/24(목)" });
});

// 택배가 일요일에 수거하지 않는다
test("일요일은 건너뛴다", () => {
  // 2026-09-25(금) → 토요일, (일요일 건너뜀) 월요일
  const options = pickupDateOptions(new Date("2026-09-25T10:00:00+09:00"));

  expect(options.map((option) => option.label)).toEqual(["9/26(토)", "9/28(월)"]);
});

test("해와 달이 바뀌어도 이어서 센다", () => {
  const options = pickupDateOptions(new Date("2026-12-31T10:00:00+09:00"));

  expect(options.map((option) => option.value)).toEqual(["2027-01-01", "2027-01-02"]);
});
