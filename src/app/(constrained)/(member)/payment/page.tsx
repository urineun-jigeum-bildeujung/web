// 결제하기 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { CheckoutView } from "@/views/checkout";

export default function PaymentPage() {
  // 결제창이 실패로 돌아올 때 쿼리를 읽는다. `useSearchParams`는 경계가 없으면 빌드에서 막힌다.
  //
  // 이 라우트만 `fallback`이 비어 있어 다른 아홉 라우트와 같은 자리표시를 준다. 비워 두면
  // 경계가 열리는 동안 높이가 0이라 화면이 한 번 접혔다 펴진다 (#255).
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <CheckoutView />
    </Suspense>
  );
}
