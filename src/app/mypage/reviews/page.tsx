// 나의 상품 후기 라우트.
import { Suspense } from "react";

import { MOCK_WRITABLE, MyReviewsView } from "@/views/my-reviews";

export default function MyReviewsPage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  // 작성 가능한 목록은 그 API가 아직 없어 목데이터다. 작성한 목록은 화면이 서버에서 받는다(#291).
  return (
    <Suspense>
      <MyReviewsView writable={MOCK_WRITABLE} />
    </Suspense>
  );
}
