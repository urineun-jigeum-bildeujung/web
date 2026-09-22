// 배송지 설정. 저장해 둔 곳 중에서 고르거나 새로 넣는다.
// UI 시안 기준(paym_011 532:17911)이다.
//
// **목록은 `entities/address`에 있다.** 마이페이지의 배송지 관리가 같은 것을 쓰게 되면서
// 내려갔다 (#329). 이 화면이 맡는 것은 머리말과 자리 잡기뿐이다.
//
// **고르는 API는 없다.** 여기서 고른 `addressId`를 주문 생성에 넘긴다.

"use client";

import { AddPlaceLink, AddressPlaceList, useQueryAddresses } from "@/entities/address";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export function CheckoutAddressView() {
  // 대기 표시 없음 — 첫 그림뿐이라 목록의 Skeleton이 덮는다. 줄을 눌러 기다리는 자리가 없다
  const { addresses, isLoading, error } = useQueryAddresses();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="배송지 설정" />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-8">
        {/* 등록·수정을 마치면 이 화면으로 돌아온다. 결제를 이어가야 해서다 (#369) */}
        <AddressPlaceList
          addresses={addresses}
          isLoading={isLoading}
          error={error}
          from="/payment/address"
        />
        <AddPlaceLink from="/payment/address" />
      </main>
    </div>
  );
}
