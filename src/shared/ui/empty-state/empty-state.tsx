// 목록이 비었을 때 무엇이 없는지와 다음에 할 일을 보여준다.
// IA 기준(타임딜·배송지·검색 결과)과 PRD 예외 케이스(맞는 리뷰·상품 없음, 피드백 데이터 없음)다.
// 제목·본문 타이포는 메인 타임딜 빈 상태 시안 기준이고, 나머지 화면은 아직 시안이 없다.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type EmptyStateProps = {
  /** 무엇이 없는지 한 줄로 */
  title: ReactNode;
  /** 왜 없는지, 무엇을 하면 되는지 */
  description?: ReactNode;
  /** 제목 위 아이콘이나 일러스트 */
  icon?: ReactNode;
  /** 다음 행동으로 이끄는 버튼 */
  action?: ReactNode;
  /** 기본은 굵은 18px 제목이지만, 시안이 다르게 그린 화면(Q&A 빈 상태 등)만 덮어쓴다 */
  titleClassName?: string;
  descriptionClassName?: string;
} & ComponentProps<"div">;

export function EmptyState({
  title,
  description,
  icon,
  action,
  titleClassName,
  descriptionClassName,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        // 시안의 그림은 72px이고 색은 `#B1B3BB` — `icon-fill-tertiary`와 정확히 같은 값이다.
        // 아이콘이 `currentColor`를 물려받으므로 다크 모드도 토큰이 알아서 따라온다.
        <div aria-hidden className="text-icon-fill-tertiary [&>svg]:size-18">
          {icon}
        </div>
      )}
      {/* 제목·설명은 4px로 좁게 묶고, 아이콘·이 묶음·버튼 사이는 부모의 8px 간격을 그대로 쓴다 */}
      <div className="flex flex-col gap-1">
        <p className={cn("text-title-bold-18 text-foreground", titleClassName)}>{title}</p>
        {description && (
          <p
            className={cn(
              "text-body-medium-14 text-balance text-text-body-secondary",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
