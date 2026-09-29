// 화면 상단 머리말. 왼쪽·가운데·오른쪽 세 자리를 열어 두고 뒤로가기·닫기·로고를 기본으로 제공한다.
// 시안의 공용 header 컴포넌트(3581:82062, UI 페이지 인스턴스 295개)가 기준이다. 높이 48에 좌우 20,
// 제목은 title/bold_18이다. 모든 화면이 이것 하나를 써 화면마다 달라 보이지 않게 한다 (#513).

"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { HeaderBackButton } from "./header-back-button";

type Leading = "back" | "close" | "logo" | "none";

type PageHeaderProps = {
  /**
   * 가운데 제목. 문자열이면 h1로 그린다. 다이얼로그처럼 제목 요소가 따로 정해진 곳은
   * 그 요소(`DialogTitle` 등)를 그대로 넘긴다
   */
  title?: ReactNode;
  /** 왼쪽 자리를 직접 채운다. 지정하면 leading 기본 모양을 대체한다 */
  left?: ReactNode;
  /** 오른쪽 자리. 검색·알림·장바구니는 `HeaderIconLink` 슬롯으로 넣는다 */
  right?: ReactNode;
  /** 왼쪽 기본 모양. 뒤로가기 화살표·닫기 X·서비스 로고(시안 type=logo) */
  leading?: Leading;
  /** 기본 버튼을 눌렀을 때. 없으면 브라우저 뒤로가기 */
  onLeadingClick?: () => void;
} & Omit<ComponentProps<"header">, "title">;

/** 브라우저 뒤로가기일 때만 라우터를 부른다. 누를 때 할 일을 받은 곳은 라우터 없이도 그려진다 */
function RouterBackButton({ icon }: { icon: "back" | "close" }) {
  const router = useRouter();
  return <HeaderBackButton icon={icon} onClick={() => router.back()} />;
}

function LeadingSlot({
  leading,
  onLeadingClick,
}: {
  leading: Leading;
  onLeadingClick?: () => void;
}) {
  if (leading === "none") return null;
  if (leading === "logo") {
    // 시안은 88×44 "로고" 자리 표시다. 로고 자산이 오기 전까지 서비스 이름 글자로 두고, 홈과 마이페이지가
    // 같은 모양을 쓴다 — 전에는 홈이 브랜드색, 마이페이지가 검정에 8px 안쪽이라 두 화면이 달랐다
    return <span className="text-title-bold-18 whitespace-nowrap text-brand">골라주개냥</span>;
  }
  return onLeadingClick ? (
    <HeaderBackButton icon={leading} onClick={onLeadingClick} />
  ) : (
    <RouterBackButton icon={leading} />
  );
}

export function PageHeader({
  title,
  left,
  right,
  leading = "back",
  onLeadingClick,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      // 좌우 슬롯 폭이 달라도 제목이 화면 중앙에 오도록 3열 그리드로 잡는다.
      // justify-between으로 두면 오른쪽에 버튼을 더할 때마다 제목이 밀린다.
      // 왼쪽 칸 최소 폭은 뒤로가기 누르는 자리(48px)다
      className={cn(
        "grid h-12 grid-cols-[minmax(3rem,1fr)_auto_minmax(3rem,1fr)] items-center gap-2 px-5",
        className,
      )}
      {...props}
    >
      {/* 좌우 자리를 같은 폭으로 잡아야 가운데 제목이 화면 중앙에 온다 */}
      <div className="flex items-center justify-start">
        {left ?? <LeadingSlot leading={leading} onLeadingClick={onLeadingClick} />}
      </div>

      {/* 제목이 없어도 가운데 칸을 비워 둔다. sr-only는 position:absolute라
          그리드 배치에서 빠지고, 그러면 오른쪽 슬롯이 가운데 칸으로 올라온다. */}
      {typeof title === "string" || typeof title === "number" ? (
        // 시안의 공용 header가 title/bold_18·text/body/default를 쓴다 (#172)
        <h1 className="truncate text-title-bold-18 text-text-body-default">{title}</h1>
      ) : (
        (title ?? <span />)
      )}

      {/* 시안의 오른쪽 아이콘은 회색(icon/stroke/tertiary)이다. 자식이 스스로 색을 정하면 그대로 우선한다.
          슬롯 사이는 공용 header의 wrapper_icon 간격(spacing/4)이다 — 슬롯 모양은 HeaderIconLink가 갖는다 */}
      <div className="flex items-center justify-end gap-1 text-icon-stroke-tertiary">{right}</div>
    </header>
  );
}
