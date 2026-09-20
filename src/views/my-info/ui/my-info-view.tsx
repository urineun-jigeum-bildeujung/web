// 내 정보. 회원 정보와 배송지를 모아 보여주고 각 항목을 수정 화면으로 잇는다.
// UI 시안 기준(mypa_011, 1482-27384)이다.
//
// 시안은 이름·생년월일 줄에도 화살표가 있으나 고칠 화면이 없어(#64) 화살표 없이 둔다.
// "내 아이들" 값 자리는 시안이 닉네임 더미라 아이 이름을 이어 보인다.
//
// 값이 전부 서버에서 온다(#266). 아직 받는 자리가 없는 이름·생년월일은 비어 온다.

"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useQueryAddresses } from "@/entities/address";
import { useQueryMyProfile } from "@/entities/member";
import { useQueryPets } from "@/entities/pet";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

/** 아직 받는 자리가 없는 칸. 비어 있음을 말로 알린다 */
const NOT_SET = "등록 전이에요";

/** 지은 이름으로 아이콘을 고른다. 시안(mypa_011)이 집·회사에만 그림을 둔다 */
const ICON_BY_NAME: Record<string, { name: "home" | "building"; className: string }> = {
  집: { name: "home", className: "text-icon-fill-brand" },
  회사: { name: "building", className: "text-icon-fill-light-blue" },
};

/** `2000-12-13` → `2000년 12월 13일`. 서버가 ISO로 준다 */
function formatBirth(birth: string): string {
  const [year, month, day] = birth.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

/** 회원 정보 한 줄. 값은 오른쪽에 붙고, 고칠 화면이 있으면 줄 전체가 링크다 */
function InfoRow({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="text-body-medium-16 text-foreground">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <span className="truncate text-body-medium-14 text-text-body-secondary">{value}</span>
        {href && <Icon name="right" className="size-7 shrink-0 text-icon-stroke-tertiary" />}
      </span>
    </>
  );
  const className = "flex h-10 w-full items-center justify-between gap-2 py-1";

  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function MyInfoView() {
  const { profile, isLoading } = useQueryMyProfile();
  const { pets } = useQueryPets();
  const { addresses } = useQueryAddresses();

  // 값 자리만 자리를 잡는다. 줄과 레이블은 서버에서 오는 것이 아니라 그대로 그린다
  const pending = <Skeleton className="h-4 w-24" />;
  const value = (text: string | null | undefined) => (isLoading ? pending : (text ?? NOT_SET));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={profile ? `${profile.nickname}님의 정보` : "내 정보"} />

      <main className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-8">
        <section className="flex flex-col gap-1">
          <InfoRow label="닉네임" value={value(profile?.nickname)} href="/mypage/info/nickname" />
          <InfoRow label="이름" value={value(profile?.name)} />
          <InfoRow
            label="생년월일"
            value={isLoading ? pending : profile?.birth ? formatBirth(profile.birth) : NOT_SET}
          />
          <InfoRow label="휴대폰 번호" value={value(profile?.phone)} href="/mypage/info/phone" />
          <InfoRow
            label="내 아이들"
            value={pets?.length ? pets.map((pet) => pet.name).join(", ") : NOT_SET}
            href="/mypage/pets"
          />
        </section>

        <span aria-hidden className="h-px w-full bg-border-default" />

        <section className="flex flex-col gap-4">
          <h2 className="text-title-bold-20 text-foreground">배송 받을 곳</h2>

          <div className="flex flex-col gap-5">
            {(addresses ?? []).map((item) => {
              const icon = ICON_BY_NAME[item.addressName];
              return (
                <Link
                  key={item.addressId}
                  // 같은 화면이 새 배송지와 수정 두 가지를 맡는다. 어느 곳인지는 쿼리로 넘긴다
                  href={`/mypage/address/new?place=${item.addressId}`}
                  className="flex flex-col gap-2 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex items-center gap-2">
                    {icon && <Icon name={icon.name} className={cn("size-7", icon.className)} />}
                    <span className="text-title-bold-16 text-foreground">{item.addressName}</span>
                    {item.isDefault && <Badge tone="strong">기본 배송지</Badge>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 text-body-medium-14 text-text-body-secondary">
                      {[item.address, item.addressDetail].filter(Boolean).join(" ")}
                    </span>
                    <Icon name="right" className="size-7 shrink-0 text-icon-stroke-tertiary" />
                  </span>
                </Link>
              );
            })}

            <div className="flex justify-center">
              <Link
                href="/mypage/address/new"
                className="flex h-8 items-center gap-1.5 rounded-md px-2 text-label-medium-14 text-text-label-default transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                장소 추가하기
                <Icon name="plus" className="text-icon-fill-secondary" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
