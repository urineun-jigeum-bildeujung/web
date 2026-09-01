// 서비스 안내 화면.
// 와이어프레임 기준(마이페이지_서비스 안내 화면)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function ServiceView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="서비스 안내" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">디자인 확정 전 자리 표시 화면입니다.</p>

        <nav className="flex flex-col gap-2">
          <Link
            href="/mypage/service/terms"
            className="flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
          >
            서비스 이용약관
          </Link>
          <Link
            href="/mypage/service/privacy"
            className="flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
          >
            개인정보 처리방침
          </Link>
        </nav>
      </main>
    </div>
  );
}
