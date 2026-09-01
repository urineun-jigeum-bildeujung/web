// 언제 도착하는지 한 줄로 알린다. 결제 전에 가장 궁금한 값이라 상단에 둔다.
// 와이어프레임 기준(paym_001, paym_002)이라 디자인 확정 시 바뀔 수 있다.

import { IoCarOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type DeliveryNoticeProps = {
  children: React.ReactNode;
  className?: string;
};

export function DeliveryNotice({ children, className }: DeliveryNoticeProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground",
        className,
      )}
    >
      <IoCarOutline aria-hidden className="size-5 shrink-0 text-muted-foreground" />
      {children}
    </p>
  );
}
