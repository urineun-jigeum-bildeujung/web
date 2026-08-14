// 홈 화면. 디자인 확정 전까지 프로젝트 초기 세팅 상태를 보여주는 자리 표시 화면이다.

import { ThemeToggle } from "@/features/toggle-theme";

export function HomeView() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <p className="text-sm text-muted-foreground">소비량 예측형 스마트 구독 커머스</p>
      <h1 className="text-4xl font-bold tracking-tight">골라주개냥</h1>
      <p className="text-muted-foreground">고민은 줄이고, 우리 애한테 맞게 골라주개냥</p>

      <p className="mt-8 rounded-full border px-4 py-1.5 text-xs text-muted-foreground">
        프론트엔드 초기 세팅 단계 — 화면은 디자인 확정 후 구현됩니다
      </p>
    </main>
  );
}
