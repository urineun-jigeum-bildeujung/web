// 취소·반품·교환 작성 화면.
// 와이어프레임 기준(마이페이지_취소/반품/교환 작성 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

const CLAIM_TYPE_LABEL = {
  cancel: "취소",
  return: "반품",
  exchange: "교환",
} as const;

function isClaimType(value: string | undefined): value is keyof typeof CLAIM_TYPE_LABEL {
  return value === "cancel" || value === "return" || value === "exchange";
}

interface OrderClaimViewProps {
  orderId: string;
  type: string | undefined;
}

export function OrderClaimView({ orderId, type }: OrderClaimViewProps) {
  const label = isClaimType(type) ? CLAIM_TYPE_LABEL[type] : "취소·반품·교환";

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={label} />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          주문 {label}을 접수한다. 디자인 확정 전 자리 표시 화면입니다.
        </p>
        <p className="text-xs text-muted-foreground">orderId: {orderId}</p>
      </main>
    </div>
  );
}
