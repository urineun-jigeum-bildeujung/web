// 타임딜 종료 시각을 서버 시계 기준에서 이 기기 시계 기준으로 옮긴다.
//
// 카운트다운은 기기 시계(`Date.now()`)로 센다. 기기 시계가 서버보다 빠르거나 느리면 서버가 이미
// 딜을 닫았는데 화면은 아직 "타임딜 구매하기"를 띄우거나, 반대로 일찍 끝내 버린다. 그래서 서버가
// 응답을 만든 시각(`serverTime`)에서 종료 시각까지 남은 시간을 기기 시계 위에 다시 놓는다(QA PD-063).

/**
 * 응답을 이 기기에서 처음 본 시각. 키는 응답의 `serverTime`이다 — 서버가 응답마다 새로 찍는다.
 *
 * **처음 본 시각에 고정한다.** 브라우저 뒤로가기·앞으로가기는 이 페이지의 응답을 캐시에서 다시 쓴다
 * (Next 16 Client Cache). 다시 그릴 때의 지금 시각으로 또 재면 캐시에 머문 시간만큼 종료 시각이
 * 늦춰져, 끝난 딜에 구매 버튼이 남는다.
 */
const firstSeenAt = new Map<string, number>();

/**
 * 서버 시각 `serverTime`에 받은 종료 시각 `endAt`을 기기 시계 위의 `Date`로 옮긴다.
 *
 * 서버에서 그릴 때는 옮기지도 기억하지도 않는다. 카운트다운은 화면에 붙은 뒤에만 세고, 서버에서
 * 기억하면 요청마다 키가 쌓여 줄지 않는다.
 */
export function toDeviceEndsAt(endAt: string, serverTime: string): Date {
  if (typeof window === "undefined") return new Date(endAt);

  let seenAt = firstSeenAt.get(serverTime);
  if (seenAt === undefined) {
    seenAt = Date.now();
    firstSeenAt.set(serverTime, seenAt);
  }
  return new Date(seenAt + Date.parse(endAt) - Date.parse(serverTime));
}
