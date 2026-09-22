// 서버가 준 시각을 화면 형식으로 옮긴다. 기준 시간대는 언제나 한국이다.
//
// **`new Date(iso)`를 그대로 그리면 표시 기준이 실행 환경을 따른다.** 국내 사용자만 쓰는
// 서비스라 대개 KST와 같지만, 자정 근처 값은 브라우저 시간대에 따라 하루 어긋난다. 같은
// 주문이 기기마다 다른 날짜로 보이는 것은 사실 관계가 흔들리는 일이라 기준을 못 박는다 (#295).
//
// **date-fns가 아니라 `Intl.DateTimeFormat`을 쓴다.** date-fns v4에서 시간대를 지정하려면
// `@date-fns/tz`를 따로 들여야 하는데, 플랫폼이 이미 하는 일이다
// (library-convention "이미 되는지 먼저 본다"의 플랫폼 기능 항목).
//
// 그래서 `date-fns`는 설치돼 있기만 하고 한 번도 쓰이지 않다가 걷어냈다 (#340).
// **서버가 주는 날짜는 전부 이 파일을 거친다.** 화면에서 직접 포맷하지 않는다.

/** 서버가 `+09:00`으로 기록하고 화면도 여기에 맞춘다 */
const TIME_ZONE = "Asia/Seoul";

// `hourCycle: "h23"`이 있어야 `오후 03` 대신 `15`가 온다. 조립은 우리가 하므로 로캘은
// 자릿수 채움에만 관여한다
const FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type DateParts = Record<Intl.DateTimeFormatPartTypes, string>;

/**
 * 한국 기준으로 쪼갠 조각. 읽을 수 없는 값이면 `null`이다.
 *
 * 로캘마다 구분자와 순서가 달라 포맷 결과 문자열을 그대로 쓸 수 없다. `formatToParts`로
 * 받아 우리가 조립한다.
 */
function toParts(iso: string): DateParts | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Object.fromEntries(
    FORMATTER.formatToParts(date).map((part) => [part.type, part.value]),
  ) as DateParts;
}

/**
 * `26.08.28` 꼴. 읽을 수 없는 값이면 `null`이다.
 *
 * **날짜만 있는 값(`2026-07-20`)도 이 함수로 간다.** 그런 문자열은 UTC 자정으로 읽히는데,
 * 한국이 양수 오프셋이라 KST로 그리면 같은 날 09시가 되어 날짜가 그대로다.
 */
export function formatDisplayDate(iso: string): string | null {
  const parts = toParts(iso);
  return parts && `${parts.year}.${parts.month}.${parts.day}`;
}

/** `26.08.28 15:43` 꼴. 읽을 수 없는 값이면 `null`이다 */
export function formatDisplayDateTime(iso: string): string | null {
  const parts = toParts(iso);
  return parts && `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

/**
 * 한국 기준 하루 키(`2026-09-25`). 두 시각이 같은 날인지 견줄 때 쓴다.
 *
 * date-fns의 `isToday`·`isTomorrow`는 브라우저 시간대로 판정해서, 자정 근처 값이 실제와
 * 하루 어긋난다. 같은 날인지는 이 키를 견주어 본다.
 */
export function toDisplayDayKey(iso: string): string | null {
  const parts = toParts(iso);
  return parts && `${parts.year}.${parts.month}.${parts.day}`;
}

/**
 * `오후 3시` 꼴.
 *
 * `Intl`의 로캘 기본 표기를 그대로 쓰지 않는다. `ko-KR`에 12시간제를 요구하면 실행 환경의
 * ICU에 따라 `오후`가 아니라 `PM`으로 오기도 한다.
 */
export function formatDisplayHour(iso: string): string | null {
  const parts = toParts(iso);
  if (!parts) {
    return null;
  }

  const hour = Number(parts.hour);
  // 0시는 `오전 12시`, 12시는 `오후 12시`다
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}시`;
}

/** `9월 25일 오후 3시` 꼴. 며칠 뒤 일을 말하듯 알릴 때 쓴다 */
export function formatDisplayDayHour(iso: string): string | null {
  const parts = toParts(iso);
  const hour = formatDisplayHour(iso);
  return parts && hour && `${Number(parts.month)}월 ${Number(parts.day)}일 ${hour}`;
}
