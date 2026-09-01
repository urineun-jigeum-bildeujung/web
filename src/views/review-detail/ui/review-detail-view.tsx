// 리뷰 상세 화면.
// 와이어프레임 기준(마이페이지_리뷰 상세 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

interface ReviewDetailViewProps {
  reviewId: string;
}

export function ReviewDetailView({ reviewId }: ReviewDetailViewProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="리뷰 상세" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          작성한 리뷰 상세 내용을 보여준다. 디자인 확정 전 자리 표시 화면입니다.
        </p>
        <p className="text-xs text-muted-foreground">reviewId: {reviewId}</p>
      </main>
    </div>
  );
}
