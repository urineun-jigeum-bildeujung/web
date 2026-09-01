// 추천 화면.
// IA 기준(추천)이며 시안은 아직 없다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function RecommendationsView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="추천" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          반려동물 상태 기반 맞춤 추천 목록. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
