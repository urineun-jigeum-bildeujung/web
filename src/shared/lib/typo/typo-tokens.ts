// globals.css `@theme`의 타이포 토큰 이름. tailwind-merge에 알려 주려고 코드에도 한 벌 둔다.
//
// tailwind-merge는 CSS를 읽지 않아 `text-title-bold-20`을 글자색으로 오인하고,
// `text-foreground` 같은 진짜 색과 겹치면 지워 버린다(#176). 이 목록을 글자 크기 그룹으로
// 등록해 그 충돌을 막는다. globals.css와 어긋나면 `utils.test.ts`가 잡는다.

export const TYPO_TOKENS = [
  "title-bold-16",
  "title-bold-18",
  "title-bold-20",
  "title-bold-22",
  "title-bold-24",
  "title-bold-28",
  "body-medium-14",
  "body-medium-16",
  "body-medium-18",
  "body-regular-13",
  "body-regular-14",
  "body-regular-16",
  "body-regular-18",
  "caption-regular-12",
  "caption-regular-13",
  "label-bold-11",
  "label-bold-12",
  "label-bold-14",
  "label-bold-16",
  "label-medium-11",
  "label-medium-12",
  "label-medium-14",
  "label-regular-13",
  "label-regular-14",
  "label-regular-16",
] as const;
