// 주문 상세를 불러오는 동안 보여주는 뼈대. 실제 카드와 같은 자리를 잡아 화면이 튀지 않게 한다.

import { Skeleton } from "@/shared/ui/skeleton";

/** 결제상세·배송지 카드의 줄 수. 시안(mypa_161 3324:36721·3324:36750)이 넷·넷이다 */
const PAYMENT_ROWS = [0, 1, 2, 3];
const DELIVERY_ROWS = [0, 1, 2, 3];

export function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {/* 결제일·주문번호 */}
      <section className="flex flex-col gap-2 rounded-xl bg-card p-3">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-5 w-full" />
      </section>

      {/* 주문 상품 — 제목 아래 80px 상품 줄 */}
      <section className="flex flex-col gap-3 rounded-xl bg-card px-3 py-4">
        <Skeleton className="h-7 w-28" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-card px-3 py-4">
        <Skeleton className="h-7 w-20" />
        {PAYMENT_ROWS.map((row) => (
          <Skeleton key={row} className="h-5 w-full" />
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-card px-3 py-4">
        <Skeleton className="h-7 w-24" />
        {DELIVERY_ROWS.map((row) => (
          <Skeleton key={row} className="h-5 w-full" />
        ))}
      </section>
    </div>
  );
}
