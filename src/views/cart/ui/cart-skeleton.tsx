// 장바구니를 불러오는 동안 보여주는 뼈대. 실제 줄과 같은 크기로 자리를 잡아 화면이 튀지 않게 한다.

import { Skeleton } from "@/shared/ui/skeleton";

/** 시안(cart_001)이 세 줄로 그려져 있어 같은 수만큼 자리를 잡는다 */
const ROWS = [0, 1, 2];

export function CartSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {ROWS.map((row) => (
        <li key={row} className="flex items-center gap-2 px-5 py-3">
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 self-stretch">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-end justify-between gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
