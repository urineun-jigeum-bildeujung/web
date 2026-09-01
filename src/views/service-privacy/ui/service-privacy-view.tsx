// 개인정보 처리방침 화면.
// 와이어프레임 기준(마이페이지_개인정보 처리방침 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function ServicePrivacyView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="개인정보 처리방침" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          개인정보 처리방침 전문. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
