// 리뷰 작성 화면.
// 와이어프레임 기준(마이페이지_리뷰 작성 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

interface ReviewWriteViewProps {
  /** 리뷰를 달 구매 항목의 임시 식별자. API 계약 확정 전까지 쓴다 */
  orderItemId: string | undefined;
}

export function ReviewWriteView({ orderItemId }: ReviewWriteViewProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="리뷰 작성" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          구매한 상품의 리뷰를 작성한다. 디자인 확정 전 자리 표시 화면입니다.
        </p>
        <p className="text-xs text-muted-foreground">orderItemId: {orderItemId ?? "없음"}</p>
      </main>
    </div>
  );
}
