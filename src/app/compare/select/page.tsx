// 비교할 상품 고르기 라우트. 화면 조립은 views/select-compare-product에 있다.
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
