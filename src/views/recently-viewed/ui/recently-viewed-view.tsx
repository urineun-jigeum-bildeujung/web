// 최근 본 상품 목록의 자리 표시 화면.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function RecentlyViewedView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="최근 본 상품" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          최근 확인한 상품 목록. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
