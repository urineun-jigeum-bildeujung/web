// 배송지 폼의 검증 규칙. 서버 제약을 한 곳에 모아 둔다.
//
// **이 값들은 서버 `AddressRegisterRequest`·`AddressUpdateRequest`에서 그대로 옮긴 것이다.**
// 길이만은 주문 쪽이 더 좁아 그쪽을 따른다(`ADDRESS_FIELD_MAX`, #437).
// 그전에는 저장 버튼 잠금 조건에 `!label.trim() || ...`으로 손으로 늘어놓았는데, 그러면
// 서버가 제약을 바꿔도 화면이 모르고 지나간다. 실제로 상세주소가 `@NotBlank`인 줄 모르고
// 빠뜨려 저장이 400으로 막힌 적이 있다 (#314).
//
// 우편번호와 도로명주소는 이 스키마에 없다. 이 화면에서 입력하는 값이 아니라 검색 화면이
// 주소창에 실어 보내는 값이라(AGENTS.md 5.1) 폼 필드가 아니다.

import { z } from "zod";

/**
 * 칸마다 적을 수 있는 길이. 입력칸의 `maxLength`도 이 값을 쓴다.
 *
 * **요청사항 말고는 배송지 API가 아니라 주문 쪽 컬럼에서 옮긴 값이다.** 배송지 등록은 요청사항만
 * 길이를 보고 나머지는 `@NotBlank`뿐이라 긴 값도 저장된다. 그런데 주문은 배송지를 복사해 두는
 * 컬럼이 더 짧아서(`order-service` `DeliveryAddress`), 긴 값으로 저장한 배송지로 결제하면 주문
 * 저장이 DB에서 막혀 500이 난다 (#437).
 */
export const ADDRESS_FIELD_MAX = {
  addressName: 50,
  receiver: 50,
  phone: 20,
  addressDetail: 100,
  /** 서버 `@Size(max = 100)`. 배송지 등록 자체의 제약이다 */
  deliveryNote: 100,
} as const;

export const addressFormSchema = z.object({
  addressName: z.string().trim().min(1).max(ADDRESS_FIELD_MAX.addressName),
  receiver: z.string().trim().min(1).max(ADDRESS_FIELD_MAX.receiver),
  phone: z.string().trim().min(1).max(ADDRESS_FIELD_MAX.phone),
  addressDetail: z.string().trim().min(1).max(ADDRESS_FIELD_MAX.addressDetail),
  // 유일하게 비워도 되는 칸이다. 빈 값을 등록과 수정에서 다르게 보내는 것은 화면이 정한다
  deliveryNote: z.string().trim().max(ADDRESS_FIELD_MAX.deliveryNote),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
