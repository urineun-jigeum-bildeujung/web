// 타임딜 화면.
// IA 기준(타임딜)이며 시안은 아직 없다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function DealsView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="타임딜" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          기간 한정 할인 상품 목록. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
