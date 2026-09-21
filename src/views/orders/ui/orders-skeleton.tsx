// 주문을 불러오는 동안 보여주는 뼈대. 실제 카드와 같은 크기로 자리를 잡아 화면이 튀지 않게 한다.

import { Skeleton } from "@/shared/ui/skeleton";

/** 시안(mypa_061)이 네 건으로 그려져 있어 같은 수만큼 자리를 잡는다 */
const CARDS = [0, 1, 2, 3];

export function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {CARDS.map((card) => (
        <div key={card} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {/* 주문 일자 줄 */}
            <Skeleton className="h-4 w-28" />

            <div className="flex items-start gap-2">
              <Skeleton className="size-24 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* 행동 버튼 줄. 시안이 36px이다 */}
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
