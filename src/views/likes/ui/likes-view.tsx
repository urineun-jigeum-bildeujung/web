// 좋아요 화면. 하단 탭바(BottomNav)의 루트 화면이다.
// 와이어프레임 기준(좋아요 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";
import { BottomNav } from "@/widgets/bottom-nav";

export function LikesView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="좋아요" leading="none" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          찜한 상품 목록. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
