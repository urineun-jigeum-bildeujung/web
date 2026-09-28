// 장소 이름으로 아이콘을 고르는 표.
//
// **집·회사는 서버에 없는 개념이다.** 종류를 내려주지 않으므로 `addressName`으로 골라
// 아이콘을 붙인다(명세 행의 화면 대조 메모, 2026-09-09).

import type { IconName } from "@/shared/ui/icon/icon-shapes";

/**
 * 시안이 늘 자리를 잡아 두는 이름. 저장한 곳이 없어도 목록에 빈 줄로 선다 (`paym_011` 1117:4825).
 *
 * 서버에는 빈 자리가 없다 — 등록 API가 주소를 필수로 받는다. 그래서 빈 줄은 화면만의 것이고,
 * 누르면 이 이름을 채운 채 새 배송지를 넣으러 간다 (#455).
 */
export const FIXED_PLACE_NAMES = ["집", "회사"] as const;
export type FixedPlaceName = (typeof FIXED_PLACE_NAMES)[number];

/** 이 이름으로 저장한 곳에만 아이콘이 붙는다 */
const ICON_BY_NAME: Record<FixedPlaceName, IconName> = {
  집: "home",
  회사: "building",
};

/**
 * 장소 이름에 붙는 아이콘. 없으면 `undefined`다.
 *
 * **표의 제 키만 본다.** 표는 일반 객체라 `constructor`·`toString` 같은 이름으로 찾으면 물려받은
 * 함수가 나온다. 그 값이 아이콘 이름으로 흘러가면 `Icon`이 모양을 못 찾아 배송지 화면이 통째로
 * 깨지고, 다시 시도해도 같은 데이터로 또 깨진다. 이름은 사용자가 짓고 서버도 막지 않는다 (#423).
 */
export function placeIconOf(name: string): IconName | undefined {
  return Object.hasOwn(ICON_BY_NAME, name) ? ICON_BY_NAME[name as FixedPlaceName] : undefined;
}
