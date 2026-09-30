// 결제 화면의 도착 예정 한 줄을 만든다. "지금 주문하면 모레(10/2) 도착해요" (QA No.45, #595).
//
// **서버가 배송 예정일을 주지 않아 화면이 센다.** 기능정의서·시안·README 어디에도 규칙(출고 마감
// 시각, 주말·공휴일)이 없어 시안 문구 그대로 **주문일 + 2일(모레)** 하나로 둔다. 주말도 건너뛰지
// 않는다 — 근거 없이 규칙을 지어내지 않고, 정해지면 이 파일만 고친다.
//
// **날짜는 한국 시각으로 센다.** 새벽 1시(UTC로는 전날 16시)에 열어도 "모레"는 한국의 모레여야
// 한다. 한국은 일광 절약 시간이 없어 9시간을 더한 뒤 UTC 값으로 읽으면 그대로 한국 날짜다
// (반품 수거일 `order-claim/model/pickup-dates.ts`와 같은 방식).

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 주문한 날로부터 도착까지 걸리는 날. 시안 문구가 "모레"다 */
const DAYS_TO_ARRIVE = 2;

export function arrivalNotice(now: Date): string {
  const arrival = new Date(now.getTime() + KST_OFFSET_MS + DAYS_TO_ARRIVE * DAY_MS);
  return `지금 주문하면 모레(${arrival.getUTCMonth() + 1}/${arrival.getUTCDate()}) 도착해요`;
}
