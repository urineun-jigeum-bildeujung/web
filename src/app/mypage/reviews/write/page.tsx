// /mypage/reviews/write 라우트. 화면 조립은 views/review-write에 있다.

import { ReviewWriteView } from "@/views/review-write";

export default async function ReviewWritePage({
  searchParams,
}: PageProps<"/mypage/reviews/write">) {
  const { orderItemId } = await searchParams;

  return (
    <ReviewWriteView orderItemId={Array.isArray(orderItemId) ? orderItemId[0] : orderItemId} />
  );
}
