// 배송지 폼의 검증 규칙. 서버 제약을 한 곳에 모아 둔다.
//
// **이 값들은 서버 `AddressRegisterRequest`·`AddressUpdateRequest`에서 그대로 옮긴 것이다.**
// 그전에는 저장 버튼 잠금 조건에 `!label.trim() || ...`으로 손으로 늘어놓았는데, 그러면
// 서버가 제약을 바꿔도 화면이 모르고 지나간다. 실제로 상세주소가 `@NotBlank`인 줄 모르고
// 빠뜨려 저장이 400으로 막힌 적이 있다 (#314).
//
// 우편번호와 도로명주소는 이 스키마에 없다. 이 화면에서 입력하는 값이 아니라 검색 화면이
// 주소창에 실어 보내는 값이라(AGENTS.md 5.1) 폼 필드가 아니다.

import { z } from "zod";

/** 서버 `@Size(max = 100)`. 요청사항만 길이 제한이 있고 나머지는 `@NotBlank`뿐이다 */
const DELIVERY_NOTE_MAX = 100;

export const addressFormSchema = z.object({
  addressName: z.string().trim().min(1),
  receiver: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  addressDetail: z.string().trim().min(1),
  // 유일하게 비워도 되는 칸이다. 빈 값을 등록과 수정에서 다르게 보내는 것은 화면이 정한다
  deliveryNote: z.string().trim().max(DELIVERY_NOTE_MAX),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
