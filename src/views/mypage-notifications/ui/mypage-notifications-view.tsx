// 알림 화면.
// IA 기준(마이페이지 알림)이며 시안은 아직 없다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function MypageNotificationsView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="알림" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          배송·이벤트 등 알림 목록. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
