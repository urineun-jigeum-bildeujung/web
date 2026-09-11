// 나의 상품 후기 라우트.
import { Suspense } from "react";

import { MOCK_WRITABLE, MOCK_WRITTEN, MyReviewsView } from "@/views/my-reviews";

export default function MyReviewsPage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  // 목록은 연동 전까지 목데이터다. 서버가 내려주면 이 자리에서 조회한다.
  return (
    <Suspense>
      <MyReviewsView writable={MOCK_WRITABLE} written={MOCK_WRITTEN} />
    </Suspense>
  );
}
