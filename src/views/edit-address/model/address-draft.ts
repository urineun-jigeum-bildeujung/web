// 적다 만 배송지 폼을 탭 안에서만 들고 있는다. 주소 검색이 별도 라우트라 다녀오면 사라져서다.
//
// **라우트가 바뀌면 폼이 언마운트된다.** 고른 주소는 주소창에 실려 돌아오지만 이름·연락처는
// 컴포넌트 상태라 그대로 없어진다. 새 배송지를 넣으려면 반드시 검색을 다녀와야 해서,
// 주소보다 이름을 먼저 적은 사람은 매번 다시 적어야 했다 (#370).
//
// **주소창에 싣지 않는다.** 이름·연락처는 개인정보라 주소창에 올리지 않는다. 결제가 만들어 둔
// 주문을 들고 있는 방식과 같다 (`views/checkout/model/pending-order.ts`, #367).
//
// **`localStorage`가 아니라 `sessionStorage`다.** 탭을 닫으면 사라져야 한다. 다른 날 열었는데
// 적다 만 것이 되살아나면 지운 줄 알았던 값이 저장된다.

import { z } from "zod";

import type { AddressFormValues } from "./address-form-schema";

const KEY = "address.draft";

/**
 * **적다 만 값이라 검증하지 않는다.** 모양만 본다.
 *
 * `addressFormSchema`를 그대로 쓰면 `min(1)`에 걸려 절반만 채운 것이 통째로 버려진다.
 * 빈 칸도 되살릴 값이다 — 저장 가능한지는 폼이 따로 판정한다.
 */
const draftSchema = z.object({
  addressName: z.string().default(""),
  receiver: z.string().default(""),
  phone: z.string().default(""),
  addressDetail: z.string().default(""),
  deliveryNote: z.string().default(""),
  isDefault: z.boolean().default(false),
});

/** 무엇을 고치던 중이었는지와 그때 적던 값 */
const storedSchema = z.object({ target: z.string(), values: draftSchema });

/**
 * 적어 둔 것을 읽는다. 없거나 다른 대상의 것이면 `null`이다.
 *
 * **대상이 같을 때만 쓴다.** `집`을 고치다 나가서 새 배송지를 넣으면 집 값이 새 폼에 들어찬다.
 *
 * `sessionStorage`는 사생활 보호 모드나 저장소 차단 설정에서 접근 자체가 던진다.
 * 폼을 막을 이유가 없으므로 조용히 "없음"으로 떨어뜨린다 — 그러면 빈 폼이 된다.
 */
export function readAddressDraft(target: string): AddressFormValues | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.target === target ? parsed.data.values : null;
  } catch {
    return null;
  }
}

export function writeAddressDraft(target: string, values: Partial<AddressFormValues>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ target, values }));
  } catch {
    // 적어 두지 못해도 폼은 그대로 쓴다. 검색을 다녀오면 빈 칸이 될 뿐이다
  }
}

export function clearAddressDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 탭을 닫으면 사라진다
  }
}
