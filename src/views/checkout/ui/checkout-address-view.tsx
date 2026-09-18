// 배송지 설정. 저장해 둔 곳 중에서 고르거나 새로 넣는다.
// UI 시안 기준(paym_011 532:17911)이다.
//
// 집·회사는 아이콘이 붙고, 사용자가 이름을 지어 더한 곳은 이름만 온다. 그 둘을 구분선 하나로
// 가른다 — 선이 좌우 여백 밖까지 닿아 화면을 가로지른다.
//
// **집·회사는 서버에 없는 개념이다.** 종류를 내려주지 않으므로 `addressName`으로 골라 아이콘을
// 붙인다(명세 행의 화면 대조 메모, 2026-09-09). 시안은 주소를 아직 안 넣은 "회사" 자리도
// 그리지만, 등록 API가 주소를 필수로 받아 **빈 자리는 만들어지지 않는다.** PD 확인 대상이다.
//
// **고르는 API는 없다.** 여기서 고른 `addressId`를 주문 생성에 넘긴다.

"use client";

import Link from "next/link";

import { useQueryAddresses, type Address } from "@/entities/address";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import type { IconName } from "@/shared/ui/icon/icon-shapes";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

/** 이 이름으로 저장한 곳에만 아이콘이 붙는다. 서버가 종류를 주지 않아 우리가 고른다 */
const ICON_BY_NAME: Record<string, IconName> = {
  집: "home",
  회사: "building",
};

function PlaceRow({ place }: { place: Address }) {
  const icon = ICON_BY_NAME[place.addressName];

  return (
    <Link
      href={`/mypage/address/new?place=${place.addressId}`}
      className="flex flex-col gap-2 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-center gap-2">
        {icon && <Icon name={icon} aria-hidden />}
        <span className="text-title-bold-16 text-foreground">{place.addressName}</span>
        {place.isDefault && (
          <span className="flex h-6 items-center rounded-lg bg-primary px-2 text-label-medium-12 text-primary-foreground">
            기본 배송지
          </span>
        )}
      </span>

      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-body-medium-14 text-text-body-secondary">
          {/* 도로명과 상세주소는 따로 오고 화면에서는 한 줄로 읽힌다 */}
          {`${place.address} ${place.addressDetail}`.trim()}
        </span>
        {/* 시안의 화살표는 18px이고 누르는 자리는 줄 전체다 */}
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center">
          <Icon name="right" className="size-4.5 text-icon-fill-secondary" />
        </span>
      </span>
    </Link>
  );
}

function AddressListSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  );
}

export function CheckoutAddressView() {
  // 대기 표시 없음 — 첫 그림뿐이라 아래 Skeleton이 덮는다. 줄을 눌러 기다리는 자리가 없다
  const { addresses, isLoading, error } = useQueryAddresses();

  // 이름으로 아이콘이 붙는 곳을 위에, 나머지를 아래에 둔다.
  //
  // **기본 배송지는 이름과 무관하게 맨 앞이다.** 묶음부터 가르면 이름이 집·회사가 아닌
  // 기본 배송지(`자취방` 등)가 아이콘 묶음 아래로 밀려, 맨 위가 기본이라는 읽기가 깨진다 (#239 리뷰).
  const primary = addresses?.find((place) => place.isDefault);
  const others = addresses?.filter((place) => !place.isDefault) ?? [];
  const named = others.filter((place) => ICON_BY_NAME[place.addressName]);
  const rest = others.filter((place) => !ICON_BY_NAME[place.addressName]);
  const top = primary ? [primary, ...named] : named;

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="배송지 설정" />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-8">
        {isLoading && (
          <div role="status" aria-live="polite">
            <span className="sr-only">배송지를 불러오는 중</span>
            <div aria-hidden>
              <AddressListSkeleton />
            </div>
          </div>
        )}

        {/* 조회 실패는 토스트가 아니라 화면이 직접 보여 준다. 사라지면 왜 비었는지 알 수 없다.
            **실패하면 목록을 그리지 않는다.** 재조회가 실패하면 앞서 받아 둔 값이 남아 있어,
            함께 그리면 오류 문구 아래로 옛 배송지가 따라 나온다 (#239 리뷰) */}
        {error && <EmptyState role="alert" {...APP_MESSAGE[toAppMessageCode(error)]} />}

        {!isLoading &&
          !error &&
          (addresses?.length === 0 ? (
            <EmptyState
              title="등록된 배송지가 없어요"
              description="상품을 배송받을 주소를 먼저 넣어주세요."
            />
          ) : (
            <>
              {top.length > 0 && (
                <div className="flex flex-col gap-3">
                  {top.map((place) => (
                    <PlaceRow key={place.addressId} place={place} />
                  ))}
                </div>
              )}

              {/* 시안의 선은 좌우 여백을 넘어 화면을 가로지른다. 양쪽에 줄이 있을 때만 그린다 */}
              {top.length > 0 && rest.length > 0 && <hr className="-mx-5 border-border" />}

              {rest.map((place) => (
                <PlaceRow key={place.addressId} place={place} />
              ))}
            </>
          ))}

        <Link
          href="/mypage/address/new"
          className={cn(
            "flex min-h-11 items-center justify-center gap-1 rounded-lg text-body-medium-14 text-text-body-secondary transition-colors",
            "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          )}
        >
          장소 추가하기
          <Icon name="plus" aria-hidden />
        </Link>
      </main>
    </div>
  );
}
