// 결제하기 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { CheckoutView } from "@/views/checkout";

export default function PaymentPage() {
  // 결제창이 실패로 돌아올 때 쿼리를 읽는다. `useSearchParams`는 경계가 없으면 빌드에서 막힌다
  return (
    <Suspense>
      <CheckoutView />
    </Suspense>
  );
}
