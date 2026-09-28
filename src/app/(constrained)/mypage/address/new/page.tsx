// 배송지 추가·수정 라우트.
import { Suspense } from "react";

import { EditAddressView } from "@/views/edit-address";

export default function NewAddressPage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  // Suspense로 감싸지 않으면 정적 프리렌더가 실패한다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <EditAddressView />
    </Suspense>
  );
}
