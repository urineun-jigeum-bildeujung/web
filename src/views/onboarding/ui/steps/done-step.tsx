// 온보딩 완료. 홈으로 가거나 다음 아이의 프로필을 이어서 등록한다.
// UI 시안 기준(onbo_005)이다.
//
// 5마리를 채웠으면 이어서 등록하는 버튼과 그 권유 문구를 뺀다(QA No.130, #527). 그 경우의
// 시안은 없어 새 문구를 만들지 않고 시안 문구에서 권유 부분만 덜었다.

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";

type DoneStepProps = {
  petName: string;
  onGoHome: () => void;
  /** 반려동물이 더 있으면 같은 흐름을 다시 돈다 */
  onAddProfile: () => void;
  /** 더 들일 수 있는지. 거짓이면 "프로필 추가"와 권유 문구가 없다 */
  canAddMore: boolean;
};

export function DoneStep({ petName, onGoHome, onAddProfile, canAddMore }: DoneStepProps) {
  const who = petName || "아이";

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-5 text-center">
        <div
          aria-hidden
          className="flex size-27 items-center justify-center rounded-full bg-brand text-brand-foreground"
        >
          <Icon name="check" className="size-16" />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-title-bold-20 text-foreground">
            {who}의 프로필 등록이 끝났어요
            {canAddMore && (
              <>
                <br />
                함께할 다른 가족이 더 있나요?
              </>
            )}
          </h1>
          {canAddMore && (
            <p className="text-body-medium-16 text-text-body-secondary">
              반려동물이 더 있다면 프로필을 추가해
              <br />
              맞춤 관리를 받아보세요
            </p>
          )}
        </div>
      </main>

      <BottomActionBar>
        <Button variant="secondary" onClick={onGoHome}>
          홈으로 이동
        </Button>
        {canAddMore && (
          <Button
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={onAddProfile}
          >
            프로필 추가
          </Button>
        )}
      </BottomActionBar>
    </>
  );
}
