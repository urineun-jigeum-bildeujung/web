// 배송지 관리 화면.
// 와이어프레임 기준(마이페이지_배송지 관리 화면)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";
import Link from "next/link";

export function AddressesView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="배송지 관리" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          등록된 배송지 목록을 관리한다. 디자인 확정 전 자리 표시 화면입니다.
        </p>

        <nav className="flex flex-col gap-2">
          <Link
            href="/mypage/address/new"
            className="flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
          >
            배송지 추가
          </Link>
        </nav>
      </main>
    </div>
  );
}
