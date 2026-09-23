// 수거 희망일 보기를 만든다. 내일부터 가까운 두 날이고, 일요일은 건너뛴다.
//
// 시안(mypa_361 3324:38944)의 두 칸 "9/24(목)"은 예시 값이다. 안내 문구가 "1~2일 안에 기사님이
// 상품을 수거해요"라 가까운 두 날을 보인다. 택배가 일요일에는 수거하지 않아 그날은 뺀다 (#408).
//
// **날짜는 한국 시각으로 센다.** 새벽 1시(UTC로는 전날 16시)에 열어도 "내일"은 한국의 내일이어야
// 한다. 한국은 일광 절약 시간이 없어 9시간을 더한 뒤 UTC 값으로 읽으면 그대로 한국 날짜다.

export type PickupDate = {
  /** 요청 글에 싣는 값. `YYYY-MM-DD` */
  value: string;
  /** 칸에 쓰는 글. 시안 모양 `9/24(목)` */
  label: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SUNDAY = 0;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

/** 시안이 칸을 둘 그린다 */
const OPTION_COUNT = 2;

export function pickupDateOptions(now: Date): PickupDate[] {
  const options: PickupDate[] = [];

  for (let daysLater = 1; options.length < OPTION_COUNT; daysLater += 1) {
    const kst = new Date(now.getTime() + KST_OFFSET_MS + daysLater * DAY_MS);
    const weekday = kst.getUTCDay();
    if (weekday === SUNDAY) {
      continue;
    }

    const month = kst.getUTCMonth() + 1;
    const day = kst.getUTCDate();
    options.push({
      value: `${kst.getUTCFullYear()}-${pad(month)}-${pad(day)}`,
      label: `${month}/${day}(${WEEKDAYS[weekday]})`,
    });
  }

  return options;
}
