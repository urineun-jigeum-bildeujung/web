// 온보딩 완료. 홈으로 가거나 맞춤 추천을 바로 본다.
// 와이어프레임 기준(onbo_005)이라 디자인 확정 시 바뀔 수 있다.

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

type DoneStepProps = {
  petName: string;
  onGoHome: () => void;
  onGoRecommendation: () => void;
};

export function DoneStep({ petName, onGoHome, onGoRecommendation }: DoneStepProps) {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="size-32 rounded-full bg-muted" aria-hidden />
        <h1 className="text-xl font-bold text-foreground">
          {petName ? `${petName}만을 위한` : "우리 아이만을 위한"} 맞춤 식탁 준비 완료!
        </h1>
        <p className="text-sm text-muted-foreground">
          건강 고민과 체질에 꼭 맞는 펫푸드만 골라서 추천해 드릴게요.
        </p>
      </main>

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={onGoHome}>
          홈으로 이동
        </Button>
        <Button className="min-h-11" onClick={onGoRecommendation}>
          맞춤 사료 보러가기
        </Button>
      </BottomActionBar>
    </>
  );
}
