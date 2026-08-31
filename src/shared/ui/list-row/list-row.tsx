// 아이콘·제목·보조설명·화살표로 이루어진 목록 한 줄. 눌러서 다른 화면으로 가는 항목에 쓴다.
// 와이어프레임 기준(mypa_001 아홉 항목, mypa_011)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { IoChevronForward } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type ListRowBaseProps = {
  title: ReactNode;
  /** 제목 아래 작게 붙는 설명 */
  description?: ReactNode;
  /** 왼쪽 아이콘 */
  icon?: ReactNode;
  /** 오른쪽에 화살표 대신 넣을 것. 값 표시나 뱃지 */
  trailing?: ReactNode;
  /** 화살표를 숨긴다. 눌러도 이동하지 않는 항목에 쓴다 */
  hideChevron?: boolean;
  className?: string;
};

const ROW_CLASS =
  "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

function RowInner({ title, description, icon, trailing, hideChevron }: ListRowBaseProps) {
  return (
    <>
      {/* 제목이 옆에 글자로 있으므로 아이콘은 장식으로 둔다 */}
      {icon && (
        <span aria-hidden className="shrink-0 text-muted-foreground [&>svg]:size-5">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        {description && (
          <span className="truncate text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      {trailing}
      {!hideChevron && (
        <IoChevronForward aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );
}

// title이 ReactNode라 Link·button의 HTML title 속성과 겹친다. 우리 쪽을 쓴다.
type LinkRest = Omit<ComponentProps<typeof Link>, "href" | "children" | "title">;

/** 다른 화면으로 이동하는 줄 */
export function ListRowLink({
  href,
  className,
  title,
  description,
  icon,
  trailing,
  hideChevron,
  ...rest
}: ListRowBaseProps & { href: string } & LinkRest) {
  return (
    <Link href={href} className={cn(ROW_CLASS, className)} {...rest}>
      <RowInner
        title={title}
        description={description}
        icon={icon}
        trailing={trailing}
        hideChevron={hideChevron}
      />
    </Link>
  );
}

/**
 * 아직 갈 곳이 없는 줄. 시안에는 있으나 화면을 만들지 않은 항목에 쓴다.
 * 없는 주소로 링크를 걸면 눌렀을 때 404가 되므로 그 전까지 이것으로 둔다.
 */
export function ListRowStatic({
  className,
  title,
  description,
  icon,
  trailing,
}: Omit<ListRowBaseProps, "hideChevron">) {
  return (
    <div className={cn(ROW_CLASS, "hover:bg-transparent", className)}>
      {/* 갈 곳이 없으므로 화살표를 달지 않는다. 달면 눌리는 줄로 보인다 */}
      <RowInner
        title={title}
        description={description}
        icon={icon}
        trailing={trailing}
        hideChevron
      />
    </div>
  );
}

/** 그 자리에서 동작을 실행하는 줄 */
export function ListRowButton({
  className,
  title,
  description,
  icon,
  trailing,
  hideChevron,
  ...rest
}: ListRowBaseProps & Pick<ComponentProps<"button">, "onClick" | "disabled">) {
  return (
    <button type="button" className={cn(ROW_CLASS, className)} {...rest}>
      <RowInner
        title={title}
        description={description}
        icon={icon}
        trailing={trailing}
        hideChevron={hideChevron}
      />
    </button>
  );
}
