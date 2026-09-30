// 배송지 설정. 저장해 둔 곳 중에서 고르거나 새로 넣는다.
// UI 페이지 시안 기준(paym_011 1117:4825)이다.
//
// **목록은 `entities/address`에 있다.** 마이페이지의 배송지 관리가 같은 것을 쓰게 되면서
// 내려갔다 (#329). 이 화면이 맡는 것은 머리말과 자리 잡기뿐이다.
//
// **고르는 API는 없다.** 줄을 누르면 그 `addressId`를 주소(`?address=`)에 실어 결제 화면으로
// 돌아가고, 결제 화면이 그것을 주문 생성에 넘긴다. 기본 배송지는 바꾸지 않는다 (QA No.40, #595).

"use client";

import { useSearchParams } from "next/navigation";

import { AddPlaceLink, AddressPlaceList, useQueryAddresses } from "@/entities/address";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { toAddressPickerPath, toPickedAddressPath } from "../model/return-query";

export function CheckoutAddressView() {
  // 대기 표시 없음 — 첫 그림뿐이라 목록의 Skeleton이 덮는다. 줄을 눌러 기다리는 자리가 없다
  const { addresses, isLoading, error } = useQueryAddresses();
  // 결제 화면이 고른 상품(`items`·`buy`)을 실어 보낸다. 고르고 돌아갈 때 그대로 되돌린다
  const search = useSearchParams().toString();
  // 등록·수정을 마치면 이 화면으로 돌아온다. 결제를 이어가야 해서다 (#369). 고른 상품도 함께다
  const here = toAddressPickerPath(search);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안(1117:4825)은 제목 없이 뒤로가기만 둔다(PD 확인, 2026-09-28 #448). 화면 이름은
          스크린 리더에만 남긴다 — 제목이 없으면 어느 화면에 왔는지 들을 길이 없다 */}
      <PageHeader />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-8">
        <h1 className="sr-only">배송지 설정</h1>
        <AddressPlaceList
          addresses={addresses}
          isLoading={isLoading}
          error={error}
          from={here}
          pickHref={(place) => toPickedAddressPath(search, place.addressId)}
        />
        <AddPlaceLink from={here} />
      </main>
    </div>
  );
}
