// 언제 도착하는지 한 줄로 알린다. 결제 전에 가장 궁금한 값이라 결제 정보 맨 위에 둔다.
// UI 시안 기준(paym_001 502:17151)이다.

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type DeliveryNoticeProps = {
  children: React.ReactNode;
  className?: string;
};

export function DeliveryNotice({ children, className }: DeliveryNoticeProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-md bg-surface-tertiary p-2 text-body-medium-14 text-surface-primary",
        className,
      )}
    >
      {/* 시안이 28px을 쓴다. 디자인 시스템 icon 세트의 `delivery`다 */}
      <Icon name="delivery" aria-hidden className="size-7 shrink-0" />
      {children}
    </p>
  );
}
