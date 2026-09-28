// 주문·배송 확인 라우트.
import { Suspense } from "react";

import { OrdersView } from "@/views/orders";

export default function OrdersPage() {
  // 탭을 URL(`?tab=`)에 담는다. useQueryState가 안에서 useSearchParams를 써서 감싸야
  // 빌드가 통과한다 (AGENTS.md 5.1)
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
