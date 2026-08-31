// 온보딩 도입부. 프로필 입력을 시작하거나 건너뛴다.
// 와이어프레임 기준(onbo_001)이라 디자인 확정 시 바뀔 수 있다.

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

type IntroStepProps = {
  onStart: () => void;
  onSkip: () => void;
};

export function IntroStep({ onStart, onSkip }: IntroStepProps) {
  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-foreground">딱 1분만 아이에 대해 알려주세요</h1>
          <p className="text-sm text-muted-foreground">
            건강 고민과 체질에 꼭 맞는 펫푸드만 골라서 추천해 드릴게요.
          </p>
        </header>

        {/* 디자인 확정 전까지 일러스트 자리만 잡아 둔다 */}
        <div className="flex-1 rounded-xl bg-muted" aria-hidden />
      </main>

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={onSkip}>
          건너뛰기
        </Button>
        <Button className="min-h-11" onClick={onStart}>
          프로필 입력하기
        </Button>
      </BottomActionBar>
    </>
  );
}
