// 배송지 폼 검증 규칙 테스트. 길이는 주문이 배송지를 복사해 두는 컬럼에 맞춘다 (#437).
import { expect, test } from "vitest";

import { ADDRESS_FIELD_MAX, addressFormSchema } from "./address-form-schema";

const VALID = {
  addressName: "집",
  receiver: "홍길동",
  phone: "010-1234-5678",
  addressDetail: "UI타워 4층 404호",
  deliveryNote: "",
  isDefault: true,
};

// 값은 서버에서 옮긴 것이라 여기서 못 박는다. 바꾸려면 `order-service` `DeliveryAddress`부터 본다
test.each([
  ["addressName", 50],
  ["receiver", 50],
  ["phone", 20],
  ["addressDetail", 100],
  ["deliveryNote", 100],
] as const)("%s는 %i자까지 받고 한 자라도 넘으면 막는다", (field, max) => {
  expect(ADDRESS_FIELD_MAX[field]).toBe(max);
  expect(addressFormSchema.safeParse({ ...VALID, [field]: "가".repeat(max) }).success).toBe(true);
  expect(addressFormSchema.safeParse({ ...VALID, [field]: "가".repeat(max + 1) }).success).toBe(
    false,
  );
});

// 길이는 앞뒤 공백을 뺀 뒤에 센다. 서버도 저장 전에 공백을 두고 세지 않는다
test("앞뒤 공백은 길이에 넣지 않는다", () => {
  const padded = ` ${"가".repeat(ADDRESS_FIELD_MAX.addressName)} `;

  expect(addressFormSchema.safeParse({ ...VALID, addressName: padded }).success).toBe(true);
});
