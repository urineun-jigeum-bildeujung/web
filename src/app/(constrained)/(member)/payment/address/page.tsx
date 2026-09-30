// 배송지 설정 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { CheckoutAddressView } from "@/views/checkout";

export default function PaymentAddressPage() {
  // 결제 화면이 실어 보낸 쿼리(고른 상품)를 읽는다. `useSearchParams`는 경계가 없으면 빌드에서 막힌다
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <CheckoutAddressView />
    </Suspense>
  );
}
