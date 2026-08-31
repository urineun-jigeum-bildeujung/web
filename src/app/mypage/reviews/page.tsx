// 나의 상품 후기 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { Suspense } from "react";

import { MyReviewsView } from "@/views/my-reviews";

export default function MyReviewsPage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  return (
    <Suspense>
      <MyReviewsView />
    </Suspense>
  );
}
