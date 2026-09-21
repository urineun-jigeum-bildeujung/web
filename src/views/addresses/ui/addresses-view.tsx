// 배송지 관리. 저장해 둔 곳을 보고 골라 고친다.
//
// **시안이 없다.** 2026-09-18 PD팀 답이 "작업 예정"이었다. 다만 같은 데이터를 그리는
// 결제의 배송지 설정(`paym_011`)이 확정돼 있어 그 목록을 그대로 쓴다 (#329).
//
// **지우기는 아직 없다.** `DELETE /members/me/addresses/{id}`가 열려 있지만 되돌릴 수 없는
// 동작이라 확인창 문구와 자리가 시안에 있어야 한다.

"use client";

import { AddPlaceLink, AddressPlaceList, useQueryAddresses } from "@/entities/address";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export function AddressesView() {
  const { addresses, isLoading, error } = useQueryAddresses();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="배송지 관리" />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-8">
        <AddressPlaceList addresses={addresses} isLoading={isLoading} error={error} />
        <AddPlaceLink />
      </main>
    </div>
  );
}
