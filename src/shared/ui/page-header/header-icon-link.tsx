// 머리말 오른쪽의 아이콘 링크(검색·알림·장바구니). 시안 공용 header(3581:82062)의 아이콘 슬롯 값을 한 곳에 둔다.
// 화면마다 크기·누르는 자리를 따로 주던 것을 이것 하나로 맞춘다 (#513).

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { Icon } from "@/shared/ui/icon/icon";
import type { IconName } from "@/shared/ui/icon/icon-shapes";

type HeaderIconLinkProps = {
  href: string;
  /** 링크 이름. 아이콘만 보이므로 이것이 읽힌다 */
  label: string;
  icon: IconName;
  /** 아이콘 오른쪽 위에 붙는 점·뱃지 */
  badge?: ReactNode;
  /** 링크 안에 함께 둘 것. 화면 낭독기용 문장 등 */
  children?: ReactNode;
  /** 이동 전에 부른다. `event.preventDefault()`로 이동을 막을 수 있다(비로그인 안내, #542) */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function HeaderIconLink({
  href,
  label,
  icon,
  badge,
  children,
  onClick,
}: HeaderIconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={onClick}
      // 시안은 33×32 슬롯 가운데에 28px 아이콘을 두고 슬롯 사이를 4px 띄운다(PageHeader 오른쪽 칸의 gap-1).
      // 누르는 자리는 세로만 44px까지 넓히고, 가로는 간격의 절반(2px)만 넓혀 옆 슬롯과 겹치지 않는다
      className="relative flex h-8 w-8.25 shrink-0 items-center justify-center after:absolute after:-inset-x-0.5 after:-inset-y-1.5"
    >
      {/* 점·뱃지는 링크가 아니라 아이콘 모서리에 붙인다 */}
      <span className="relative size-7">
        <Icon name={icon} className="size-7" />
        {badge}
      </span>
      {children}
    </Link>
  );
}
