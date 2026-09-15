// 내 정보. 회원 정보와 배송지를 모아 보여주고 각 항목을 수정 화면으로 잇는다.
// UI 시안 기준(mypa_011, 1482-27384)이다.
//
// 시안은 이름·생년월일 줄에도 화살표가 있으나 고칠 화면이 없어(#64) 화살표 없이 둔다.
// "내 아이들" 값 자리는 시안이 닉네임 더미라 아이 이름을 이어 보인다.

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";

/** API 연동 전까지 화면 확인용 값 */
const MOCK = {
  nickname: "졸린고양이 17",
  name: "천경진",
  birthday: "2000년 12월 13일",
  phone: "010-1234-5678",
  pets: ["코코", "보리"],
  addresses: [
    {
      id: "home",
      label: "집",
      isDefault: true,
      address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
      icon: "home" as const,
    },
    { id: "office", label: "회사", isDefault: false, address: "", icon: "building" as const },
    {
      id: "studio",
      label: "자취방",
      isDefault: false,
      address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
    },
  ],
};

/** 회원 정보 한 줄. 값은 오른쪽에 붙고, 고칠 화면이 있으면 줄 전체가 링크다 */
function InfoRow({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="text-body-medium-16 text-foreground">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <span className="truncate text-body-medium-14 text-text-body-secondary">{value}</span>
        {href && <Icon name="right" className="size-7 shrink-0 text-icon-stroke-default" />}
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
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={`${MOCK.nickname}님의 정보`} />

      <main className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-8">
        <section className="flex flex-col gap-1">
          <InfoRow label="닉네임" value={MOCK.nickname} href="/mypage/info/nickname" />
          <InfoRow label="이름" value={MOCK.name} />
          <InfoRow label="생년월일" value={MOCK.birthday} />
          <InfoRow label="휴대폰 번호" value={MOCK.phone} href="/mypage/info/phone" />
          <InfoRow label="내 아이들" value={MOCK.pets.join(", ")} href="/mypage/pets" />
        </section>

        <span aria-hidden className="h-px w-full bg-border-default" />

        <section className="flex flex-col gap-4">
          <h2 className="text-title-bold-20 text-foreground">배송 받을 곳</h2>

          <div className="flex flex-col gap-5">
            {MOCK.addresses.map((item, index) => (
              <div key={item.id} className="contents">
                {/* 시안은 집·회사 다음에 선을 긋고 그 아래에 나머지 장소를 둔다 */}
                {index === 2 && <span aria-hidden className="h-px w-full bg-border-default" />}
                <Link
                  // 같은 화면이 새 배송지와 수정 두 가지를 맡는다. 어느 곳인지는 쿼리로 넘긴다.
                  href={`/mypage/address/new?place=${item.id}`}
                  className="flex flex-col gap-2 rounded-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex items-center gap-2">
                    {item.icon && (
                      <Icon name={item.icon} className="size-7 text-icon-fill-default" />
                    )}
                    <span className="text-title-bold-16 text-foreground">{item.label}</span>
                    {item.isDefault && <Badge tone="strong">기본 배송지</Badge>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-body-medium-14",
                        item.address ? "text-text-body-secondary" : "text-text-body-tertiary",
                      )}
                    >
                      {item.address || "상품을 배송받을 주소를 입력해 주세요."}
                    </span>
                    <Icon name="right" className="size-7 shrink-0 text-icon-stroke-default" />
                  </span>
                </Link>
              </div>
            ))}

            <div className="flex justify-center">
              <Link
                href="/mypage/address/new"
                className="flex h-8 items-center gap-1.5 rounded-md px-2 text-label-medium-14 text-text-label-default transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                장소 추가하기
                <Icon name="plus" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
