// 1:1 문의 화면.
// 와이어프레임 기준(마이페이지_고객 1:1 문의 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function SupportInquiriesView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="1:1 문의" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          문의 내역과 상태를 보여준다. 새 문의 작성 방식은 연동 정책 확정 후 연결한다. 디자인 확정
          전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
