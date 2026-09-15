// 아이콘·제목·보조설명·화살표로 이루어진 목록 한 줄. 눌러서 다른 화면으로 가는 항목에 쓴다.
// UI 시안 기준(mypa_001의 메뉴 줄, mypa_081의 설정 줄)이다.
// md는 높이 44, 아이콘 28, 제목 title/bold_16, 화살표 28. sm은 높이 40, 아이콘 24, 제목 label/bold_14, 화살표 24.
//
// 좌우 여백(12px)은 줄이 갖는다. 카드가 여백을 가지면 호버 배경이 카드 끝까지 닿지 않는다.

import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

const rowVariants = cva(
  "flex w-full items-center gap-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
  {
    variants: {
      size: {
        md: "min-h-11 px-3",
        sm: "min-h-10 px-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

type RowSize = NonNullable<VariantProps<typeof rowVariants>["size"]>;

/** 크기별 아이콘·제목·화살표 클래스. 줄 높이와 함께 바뀐다 */
const SIZE_CLASS: Record<RowSize, { icon: string; title: string; chevron: string; arrow: string }> =
  {
    md: {
      icon: "[&>svg]:size-7",
      title: "text-title-bold-16",
      // 시안의 화살표는 28px이고 누르는 자리는 44px이다
      chevron: "size-11",
      arrow: "size-7",
    },
    sm: {
      icon: "[&>svg]:size-6",
      title: "text-label-bold-14",
      chevron: "size-10",
      arrow: "size-6",
    },
  };

type ListRowBaseProps = {
  title: ReactNode;
  /** 제목 아래 작게 붙는 설명 */
  description?: ReactNode;
  /** 왼쪽 아이콘. md 28px, sm 24px로 그린다 */
  icon?: ReactNode;
  /** 오른쪽에 화살표 대신 넣을 것. 값 표시나 뱃지 */
  trailing?: ReactNode;
  /** 화살표를 숨긴다. 눌러도 이동하지 않는 항목에 쓴다 */
  hideChevron?: boolean;
  /** md(44)는 마이페이지 홈 메뉴, sm(40)은 설정 줄 */
  size?: RowSize;
  className?: string;
};

function RowInner({
  title,
  description,
  icon,
  trailing,
  hideChevron,
  size = "md",
}: ListRowBaseProps) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <>
      {/* 제목이 옆에 글자로 있으므로 아이콘은 장식으로 둔다 */}
      {icon && (
        <span aria-hidden className={cn("shrink-0 text-icon-fill-default", sizeClass.icon)}>
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate text-foreground", sizeClass.title)}>{title}</span>
        {description && (
          <span className="truncate text-caption-regular-12 text-text-body-secondary">
            {description}
          </span>
        )}
      </span>
      {trailing}
      {!hideChevron && (
        <span
          aria-hidden
          className={cn("flex shrink-0 items-center justify-center", sizeClass.chevron)}
        >
          <Icon name="right" className={cn("text-icon-fill-default", sizeClass.arrow)} />
        </span>
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
  size,
  ...rest
}: ListRowBaseProps & { href: string } & LinkRest) {
  return (
    <Link href={href} className={cn(rowVariants({ size }), className)} {...rest}>
      <RowInner
        title={title}
        description={description}
        icon={icon}
        trailing={trailing}
        hideChevron={hideChevron}
        size={size}
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
  size,
}: Omit<ListRowBaseProps, "hideChevron">) {
  return (
    <div className={cn(rowVariants({ size }), "hover:bg-transparent", className)}>
      {/* 갈 곳이 없으므로 화살표를 달지 않는다. 달면 눌리는 줄로 보인다 */}
      <RowInner
        title={title}
        description={description}
        icon={icon}
        trailing={trailing}
        hideChevron
        size={size}
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
  size,
  ...rest
}: ListRowBaseProps & Pick<ComponentProps<"button">, "onClick" | "disabled">) {
  return (
    <button type="button" className={cn(rowVariants({ size }), className)} {...rest}>
      <RowInner
        title={title}
        description={description}
        icon={icon}
        trailing={trailing}
        hideChevron={hideChevron}
        size={size}
      />
    </button>
  );
}
