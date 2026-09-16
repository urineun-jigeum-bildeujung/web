// 배송지 설정. 저장해 둔 곳 중에서 고르거나 새로 넣는다.
// UI 시안 기준(paym_011 532:17911)이다.
//
// 집·회사는 미리 놓인 자리라 아이콘이 붙고, 사용자가 더한 곳은 이름만 온다.
// 그 둘을 구분선 하나로 가른다 — 선이 좌우 여백 밖까지 닿아 화면을 가로지른다.

import Link from "next/link";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import type { IconName } from "@/shared/ui/icon/icon-shapes";
import { PageHeader } from "@/shared/ui/page-header/page-header";

type Place = {
  id: string;
  label: string;
  /** 미리 놓인 자리에만 붙는다. 사용자가 더한 곳은 없다 */
  icon?: IconName;
  isDefault?: boolean;
  /** 아직 넣지 않았으면 빈 문자열 */
  address: string;
};

/** API 연동 전까지 화면 확인용 값 */
const MOCK_FIXED_PLACES: Place[] = [
  {
    id: "home",
    label: "집",
    icon: "home",
    isDefault: true,
    address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
  },
  { id: "office", label: "회사", icon: "building", address: "" },
];

/** 사용자가 더한 곳. 이름을 직접 지어 저장한다 */
const MOCK_CUSTOM_PLACES: Place[] = [
  { id: "studio", label: "자취방", address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호" },
];

function PlaceRow({ place }: { place: Place }) {
  return (
    <Link
      href={`/mypage/address/new?place=${place.id}`}
      className="flex flex-col gap-2 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-center gap-2">
        {place.icon && <Icon name={place.icon} aria-hidden />}
        <span className="text-title-bold-16 text-foreground">{place.label}</span>
        {place.isDefault && (
          <span className="flex h-6 items-center rounded-lg bg-primary px-2 text-label-medium-12 text-primary-foreground">
            기본 배송지
          </span>
        )}
      </span>

      <span className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "min-w-0 text-body-medium-14",
            // 아직 넣지 않은 곳은 안내 문구라 더 흐리다 (text/body/unselect)
            place.address ? "text-text-body-secondary" : "text-text-body-unselect",
          )}
        >
          {place.address || "상품을 배송받을 주소를 입력해 주세요."}
        </span>
        {/* 시안의 화살표는 18px이고 누르는 자리는 줄 전체다 */}
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center">
          <Icon name="right" className="size-4.5 text-icon-fill-secondary" />
        </span>
      </span>
    </Link>
  );
}

export function CheckoutAddressView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="배송지 설정" />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-8">
        <div className="flex flex-col gap-3">
          {MOCK_FIXED_PLACES.map((place) => (
            <PlaceRow key={place.id} place={place} />
          ))}
        </div>

        {/* 시안의 선은 좌우 여백을 넘어 화면을 가로지른다 */}
        <hr className="-mx-5 border-border" />

        {MOCK_CUSTOM_PLACES.map((place) => (
          <PlaceRow key={place.id} place={place} />
        ))}

        <Link
          href="/mypage/address/new"
          className="flex min-h-11 items-center justify-center gap-1 rounded-lg text-body-medium-14 text-text-body-secondary transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          장소 추가하기
          <Icon name="plus" aria-hidden />
        </Link>
      </main>
    </div>
  );
}
