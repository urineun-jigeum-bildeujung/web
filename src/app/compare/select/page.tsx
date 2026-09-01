// 비교할 상품 고르기 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { SelectCompareProductView } from "@/views/select-compare-product";

export default function SelectComparePage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SelectCompareProductView />
    </Suspense>
  );
}
