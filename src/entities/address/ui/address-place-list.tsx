// 저장해 둔 장소 목록. 결제의 배송지 설정과 마이페이지의 배송지 관리가 함께 쓴다.
// UI 페이지 시안 기준(`paym_011` 1117:4825)이다.
//
// 집·회사는 아이콘이 붙고, 사용자가 이름을 지어 더한 곳은 이름만 온다. 그 둘을 구분선 하나로
// 가른다 — 선이 좌우 여백 밖까지 닿아 화면을 가로지른다.
//
// **`views/`가 아니라 여기 있는 이유**는 두 화면이 같은 것을 쓰기 때문이다. `views/` 안에
// 두면 같은 레이어 간 참조라 막힌다 (AGENTS.md 4절, #329).
//
// **결제에서는 줄이 고르는 자리다** (QA No.40, #595). `pickHref`를 주면 줄을 누를 때 그 곳을 이번
// 주문 배송지로 고르고, 고치는 길은 줄 끝의 "수정"으로 옮긴다. 마이페이지는 주지 않아 줄이 곧 수정이다.

import Link from "next/link";
import type { ReactNode } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Skeleton } from "@/shared/ui/skeleton";

import type { Address } from "../api/addresses";
import { groupAddresses } from "../model/group-addresses";
import { placeIconOf, type FixedPlaceName } from "./place-icon";

type PlaceRowLayoutProps = {
  href: string;
  name: string;
  isDefault?: boolean;
  /** 둘째 줄. 저장한 곳은 주소, 빈 자리는 넣으라는 안내다 */
  children: ReactNode;
};

function DefaultBadge() {
  return (
    <span className="flex h-6 items-center rounded-lg bg-primary px-2 text-label-medium-12 text-primary-foreground">
      기본 배송지
    </span>
  );
}

/** 장소 한 줄의 모양. 저장한 곳과 빈 자리가 같은 틀을 쓴다 */
function PlaceRowLayout({ href, name, isDefault = false, children }: PlaceRowLayoutProps) {
  const icon = placeIconOf(name);

  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-center gap-2">
        {icon && <Icon name={icon} aria-hidden />}
        <span className="text-title-bold-16 text-foreground">{name}</span>
        {isDefault && <DefaultBadge />}
      </span>

      <span className="flex items-center justify-between gap-2">
        {children}
        {/* 시안의 화살표는 18px이고 누르는 자리는 줄 전체다 */}
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center">
          <Icon name="right" className="size-4.5 text-icon-stroke-tertiary" />
        </span>
      </span>
    </Link>
  );
}

/** 고치러 가는 주소. 고치고 돌아올 곳을 함께 싣는다 */
function editHref(place: Address, from: string) {
  return `/mypage/address/new?${new URLSearchParams({ place: String(place.addressId), from })}`;
}

/** 줄의 둘째 줄. 도로명과 상세주소는 따로 오고 화면에서는 한 줄로 읽힌다 */
function PlaceAddress({ place }: { place: Address }) {
  return (
    <span className="min-w-0 text-body-medium-14 text-text-body-secondary">
      {`${place.address} ${place.addressDetail}`.trim()}
    </span>
  );
}

/**
 * 배송지 하나를 여는 줄. **고치고 돌아올 곳을 함께 들려 보낸다.**
 *
 * 주소를 다시 고르면 검색 화면이 history에 쌓여, 저장 뒤 한 칸 되돌리면 그리로 간다 (#369).
 */
function PlaceRow({ place, from }: { place: Address; from: string }) {
  return (
    <PlaceRowLayout
      href={editHref(place, from)}
      name={place.addressName}
      isDefault={place.isDefault}
    >
      <PlaceAddress place={place} />
    </PlaceRowLayout>
  );
}

/**
 * 결제에서 이번 주문 배송지를 고르는 줄 (QA No.40, #595).
 *
 * **이름 링크의 `::after`가 줄을 통째로 덮어** 어디를 눌러도 고른다. "수정"은 링크 속 링크가 되지
 * 않게 밖에 두고 덮개 위로 올린다(`relative z-10`) — 장바구니 줄(`cart-item-link`)과 같은 방식이다.
 *
 * **고르면 이 화면을 결제 화면으로 바꿔 끼운다(`replace`).** 쌓으면 결제에서 뒤로가기가 이 목록으로
 * 되돌아온다.
 */
function PickPlaceRow({ place, from, href }: { place: Address; from: string; href: string }) {
  const icon = placeIconOf(place.addressName);

  return (
    <div className="relative flex flex-col gap-2 rounded-lg transition-colors hover:bg-muted">
      <span className="flex items-center gap-2">
        {icon && <Icon name={icon} aria-hidden />}
        <Link
          href={href}
          replace
          className="text-title-bold-16 text-foreground after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {place.addressName}
        </Link>
        {place.isDefault && <DefaultBadge />}
      </span>

      <span className="flex items-center justify-between gap-2">
        <PlaceAddress place={place} />
        <Link
          href={editHref(place, from)}
          aria-label={`${place.addressName} 수정`}
          className="relative z-10 inline-flex min-h-11 shrink-0 items-center px-2 text-body-regular-14 text-text-body-tertiary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          수정
        </Link>
      </span>
    </div>
  );
}

/**
 * 아직 주소를 넣지 않은 집·회사 자리. 시안(`paym_011` 1117:4825)이 늘 자리를 잡아 둔다.
 *
 * 누르면 **이름을 채운 채** 새 배송지를 넣으러 간다. 돌아올 곳도 함께 싣는다 (#455).
 */
function EmptyPlaceRow({ name, from }: { name: FixedPlaceName; from: string }) {
  return (
    <PlaceRowLayout href={`/mypage/address/new?${new URLSearchParams({ name, from })}`} name={name}>
      <span className="min-w-0 text-body-medium-14 text-text-body-tertiary">
        상품을 배송받을 주소를 입력해 주세요.
      </span>
    </PlaceRowLayout>
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

type AddressPlaceListProps = {
  addresses: Address[] | undefined;
  isLoading: boolean;
  error: unknown;
  /** 배송지를 고치고 돌아올 이 화면의 경로. 두 화면이 같은 목록을 써서 받아 둔다 (#369) */
  from: string;
  /**
   * 결제에서 한 곳을 골라 돌아갈 주소. 주면 줄이 고르는 자리가 되고 수정은 "수정"으로 간다.
   * 고른 것은 그 주문에만 쓰고 기본 배송지는 바꾸지 않는다 (QA No.40, #595)
   */
  pickHref?: (place: Address) => string;
};

export function AddressPlaceList({
  addresses,
  isLoading,
  error,
  from,
  pickHref,
}: AddressPlaceListProps) {
  const renderPlace = (place: Address) =>
    pickHref ? (
      <PickPlaceRow key={place.addressId} place={place} from={from} href={pickHref(place)} />
    ) : (
      <PlaceRow key={place.addressId} place={place} from={from} />
    );
  const { top, empty, rest } = groupAddresses(addresses);
  // 구분선 위 묶음. 저장한 곳 뒤에 아직 넣지 않은 집·회사 자리가 붙는다
  const hasTop = top.length > 0 || empty.length > 0;

  return (
    <>
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
      {error != null && <EmptyState role="alert" {...APP_MESSAGE[toAppMessageCode(error)]} />}

      {!isLoading &&
        error == null &&
        (addresses?.length === 0 ? (
          <EmptyState
            title="아직 등록된 배송지가 없어요"
            description="상품을 안전하게 받아보실 주소를 미리 등록해 주세요"
          />
        ) : (
          <>
            {hasTop && (
              <div className="flex flex-col gap-3">
                {top.map(renderPlace)}
                {empty.map((name) => (
                  <EmptyPlaceRow key={name} name={name} from={from} />
                ))}
              </div>
            )}

            {/* 시안의 선은 좌우 여백을 넘어 화면을 가로지른다. 양쪽에 줄이 있을 때만 그린다 */}
            {hasTop && rest.length > 0 && <hr className="-mx-5 border-border" />}

            {rest.map(renderPlace)}
          </>
        ))}
    </>
  );
}

/**
 * 목록 아래의 "장소 추가하기". 두 화면 모두 같은 자리에 둔다.
 *
 * `from`은 등록을 마치고 돌아올 이 화면의 경로다 (#369).
 */
export function AddPlaceLink({ from }: { from: string }) {
  return (
    <Link
      href={`/mypage/address/new?${new URLSearchParams({ from })}`}
      className={cn(
        "flex min-h-11 items-center justify-center gap-1 rounded-lg text-body-medium-14 text-foreground transition-colors",
        "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      장소 추가하기
      {/* 시안은 글자만 진하고 더하기는 회색이다 (`icon/fill/secondary`, #451) */}
      <Icon name="plus" aria-hidden className="text-icon-fill-secondary" />
    </Link>
  );
}
