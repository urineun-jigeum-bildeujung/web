// 저장해 둔 장소 목록. 결제의 배송지 설정과 마이페이지의 배송지 관리가 함께 쓴다.
// UI 시안 기준(`paym_011` 532:17911)이다.
//
// 집·회사는 아이콘이 붙고, 사용자가 이름을 지어 더한 곳은 이름만 온다. 그 둘을 구분선 하나로
// 가른다 — 선이 좌우 여백 밖까지 닿아 화면을 가로지른다.
//
// **`views/`가 아니라 여기 있는 이유**는 두 화면이 같은 것을 쓰기 때문이다. `views/` 안에
// 두면 같은 레이어 간 참조라 막힌다 (AGENTS.md 4절, #329).

import Link from "next/link";

import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Skeleton } from "@/shared/ui/skeleton";

import type { Address } from "../api/addresses";
import { groupAddresses } from "../model/group-addresses";
import { placeIconOf } from "./place-icon";

/**
 * 배송지 하나를 여는 줄. **고치고 돌아올 곳을 함께 들려 보낸다.**
 *
 * 주소를 다시 고르면 검색 화면이 history에 쌓여, 저장 뒤 한 칸 되돌리면 그리로 간다 (#369).
 */
function PlaceRow({ place, from }: { place: Address; from: string }) {
  const icon = placeIconOf(place.addressName);

  return (
    <Link
      href={`/mypage/address/new?${new URLSearchParams({ place: String(place.addressId), from })}`}
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

type AddressPlaceListProps = {
  addresses: Address[] | undefined;
  isLoading: boolean;
  error: unknown;
  /** 배송지를 고치고 돌아올 이 화면의 경로. 두 화면이 같은 목록을 써서 받아 둔다 (#369) */
  from: string;
};

export function AddressPlaceList({ addresses, isLoading, error, from }: AddressPlaceListProps) {
  const { top, rest } = groupAddresses(addresses);

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
            {top.length > 0 && (
              <div className="flex flex-col gap-3">
                {top.map((place) => (
                  <PlaceRow key={place.addressId} place={place} from={from} />
                ))}
              </div>
            )}

            {/* 시안의 선은 좌우 여백을 넘어 화면을 가로지른다. 양쪽에 줄이 있을 때만 그린다 */}
            {top.length > 0 && rest.length > 0 && <hr className="-mx-5 border-border" />}

            {rest.map((place) => (
              <PlaceRow key={place.addressId} place={place} from={from} />
            ))}
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
        "flex min-h-11 items-center justify-center gap-1 rounded-lg text-body-medium-14 text-text-body-secondary transition-colors",
        "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      장소 추가하기
      <Icon name="plus" aria-hidden />
    </Link>
  );
}
