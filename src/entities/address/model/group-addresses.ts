// 저장해 둔 장소를 화면에 놓는 차례로 가른다.
//
// UI 시안 기준(`paym_011` 532:17911)이다. 아이콘이 붙는 곳이 위, 구분선 아래가 나머지다.

import type { Address } from "../api/addresses";
import { placeIconOf } from "../ui/place-icon";

export type GroupedAddresses = {
  /** 구분선 위. 기본 배송지와 집·회사 */
  top: Address[];
  /** 구분선 아래. 사용자가 이름을 지어 더한 곳 */
  rest: Address[];
};

/**
 * **기본 배송지는 이름과 무관하게 맨 앞이다.**
 *
 * 묶음부터 가르면 이름이 집·회사가 아닌 기본 배송지(`자취방` 등)가 아이콘 묶음 아래로 밀려,
 * 맨 위가 기본이라는 읽기가 깨진다 (#239 리뷰).
 */
export function groupAddresses(addresses: Address[] | undefined): GroupedAddresses {
  const primary = addresses?.find((place) => place.isDefault);
  const others = addresses?.filter((place) => !place.isDefault) ?? [];
  const named = others.filter((place) => placeIconOf(place.addressName));
  const rest = others.filter((place) => !placeIconOf(place.addressName));

  return { top: primary ? [primary, ...named] : named, rest };
}
