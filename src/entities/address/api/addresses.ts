// 배송 받을 곳을 백엔드에서 받고 등록·수정·삭제한다.
//
// **고르는 API는 없다.** `/payment/address`는 목록에서 하나를 골라 `addressId`를
// 주문 생성(`POST /orders`)에 넘긴다. 서버에 "지금 고른 배송지" 같은 상태는 없다.
//
// **집·회사는 서버에 없는 개념이다.** 종류를 내려주지 않으므로 아이콘은 화면이
// `addressName`으로 고른다(명세 행의 화면 대조 메모, 2026-09-09).

import { apiRequest } from "@/shared/api/client";

const ADDRESSES_PATH = "/members/me/addresses";

/** 백엔드 `AddressResponse`와 같은 모양이다 */
export type Address = {
  addressId: number;
  /** 사용자가 지은 이름. `집`·`회사`·`자취방` */
  addressName: string;
  receiver: string;
  phone: string;
  zipCode: string;
  /** 도로명주소. 상세주소는 따로 온다 */
  address: string;
  addressDetail: string;
  /** 명세에서 유일한 nullable이다 */
  deliveryNote: string | null;
  isDefault: boolean;
};

/** 등록에 보내는 것. `deliveryNote`와 `isDefault`만 선택이다 */
export type SaveAddressRequest = {
  addressName: string;
  receiver: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  deliveryNote?: string | null;
  isDefault?: boolean;
};

/**
 * 저장해 둔 곳을 모두 가져온다.
 *
 * **기본 배송지를 앞으로 올린다.** 명세가 순서를 약속하지 않는데, 고르는 화면은 맨 위가
 * 기본값처럼 읽힌다. 순서가 흔들리면 눌렀던 자리가 매번 달라진다.
 */
export async function getAddresses(): Promise<Address[]> {
  const { addresses } = await apiRequest<{ addresses: Address[] }>(ADDRESSES_PATH);
  return [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/** 새 배송지를 등록하고 생긴 id를 돌려준다. 결제 화면에서 바로 고르려면 이 값이 필요하다 */
export async function createAddress(request: SaveAddressRequest): Promise<number> {
  const { addressId } = await apiRequest<{ addressId: number }>(ADDRESSES_PATH, {
    method: "POST",
    body: request,
  });
  return addressId;
}

/** 보낸 것만 바뀐다. 명세상 필드가 전부 선택이고 응답은 204다 */
export function updateAddress(
  addressId: number,
  request: Partial<SaveAddressRequest>,
): Promise<void> {
  return apiRequest(`${ADDRESSES_PATH}/${addressId}`, { method: "PATCH", body: request });
}

// 지우는 자리가 `/mypage/address`인데 그 화면은 PD 시안 대기다. 함수만 두고 화면 연결은 그때 한다.
export function deleteAddress(addressId: number): Promise<void> {
  return apiRequest(`${ADDRESSES_PATH}/${addressId}`, { method: "DELETE" });
}
