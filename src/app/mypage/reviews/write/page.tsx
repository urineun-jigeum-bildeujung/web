// /mypage/reviews/write 라우트. 화면 조립은 views/review-write에 있다.

import { Suspense } from "react";

import { ReviewWriteView } from "@/views/review-write";

export default async function ReviewWritePage({
  searchParams,
}: PageProps<"/mypage/reviews/write">) {
  const { orderItemId } = await searchParams;

  // 단계(`step`)를 nuqs로 읽는다. Suspense로 감싸지 않으면 정적 프리렌더가 실패한다
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ReviewWriteView orderItemId={Array.isArray(orderItemId) ? orderItemId[0] : orderItemId} />
    </Suspense>
  );
}
