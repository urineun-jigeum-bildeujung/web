// 주문을 불러오는 동안 보여주는 뼈대. 실제 주문 한 건과 같은 크기로 자리를 잡아 화면이 튀지 않게 한다.

import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

/** 시안(mypa_061)이 네 건으로 그려져 있어 첫 그림은 같은 수만큼 자리를 잡는다 */
const DEFAULT_COUNT = 4;

type OrdersSkeletonProps = {
  /** 다음 쪽을 이어 부를 때는 한 장만 세운다. 이미 그려진 목록 아래에 붙는 자리라서다 */
  count?: number;
  className?: string;
};

export function OrdersSkeleton({ count = DEFAULT_COUNT, className }: OrdersSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Array.from({ length: count }, (_, card) => (
        <div key={card} className="flex flex-col gap-3">
          {/* 결제일 줄 */}
          <Skeleton className="h-7 w-36" />

          <div className="flex flex-col gap-2">
            {/* 시각·주문 상세 줄 */}
            <Skeleton className="h-5 w-full" />
            {/* 상태 뱃지 */}
            <Skeleton className="h-5.5 w-14 rounded-sm" />

            <div className="flex items-center gap-3">
              <Skeleton className="size-20 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-5 w-10" />
              </div>
            </div>

            {/* 행동 버튼 줄. 시안이 40px이다 */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
