// 검색 화면.
// IA 기준(검색)이며 시안은 아직 없다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function SearchView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="검색" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          상품·브랜드 검색과 결과 목록. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
