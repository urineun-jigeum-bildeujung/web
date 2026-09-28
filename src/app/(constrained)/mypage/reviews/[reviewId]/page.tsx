// /mypage/reviews/[reviewId] 라우트. 화면 조립은 views/review-detail에 있다.

import { ReviewDetailView } from "@/views/review-detail";

export default async function ReviewDetailPage({
  params,
}: PageProps<"/mypage/reviews/[reviewId]">) {
  const { reviewId } = await params;
  return <ReviewDetailView reviewId={reviewId} />;
}
