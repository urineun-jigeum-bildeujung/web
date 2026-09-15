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
} & ComponentProps<"div">;

export function EmptyState({
  title,
  description,
  icon,
  action,
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
        <div aria-hidden className="mb-2 text-muted-foreground [&>svg]:size-12">
          {icon}
        </div>
      )}
      <p className="text-title-bold-18 text-foreground">{title}</p>
      {description && (
        <p className="text-body-medium-14 text-balance text-text-body-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
