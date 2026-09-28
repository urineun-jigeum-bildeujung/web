// 나의 상품 후기 라우트.
import { Suspense } from "react";

import { MyReviewsView } from "@/views/my-reviews";

export default function MyReviewsPage() {
  // useQueryState가 내부에서 useSearchParams를 쓴다.
  // 두 탭 모두 화면이 서버에서 받는다(#291·#349).
  return (
    <Suspense>
      <MyReviewsView />
    </Suspense>
  );
}
