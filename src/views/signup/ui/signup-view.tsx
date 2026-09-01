// 회원가입 화면.
// 와이어프레임 기준(SNIN_001)이라 디자인 확정 시 바뀔 수 있다.

import { PageHeader } from "@/shared/ui/page-header/page-header";

export function SignupView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="회원가입" />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          닉네임·이름·전화번호 인증·약관 동의를 입력한다. 디자인 확정 전 자리 표시 화면입니다.
        </p>
      </main>
    </div>
  );
}
