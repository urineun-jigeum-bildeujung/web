// 온보딩 도입부. 프로필 입력을 시작한다.
// UI 시안 기준(onbo_001)이다.
//
// 건너뛰기 버튼은 두지 않는다. 시안에 버튼이 하나뿐이고 섹션 메모도
// "건너뛰기, 닫기 버튼 삭제"라고 적고 있다.

import Image from "next/image";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

type IntroStepProps = {
  onStart: () => void;
};

export function IntroStep({ onStart }: IntroStepProps) {
  return (
    // 위 절반은 흰색, 아래로 갈수록 브랜드 연한색이다. 시안의 프레임 배경 그라데이션
    <div className="flex flex-1 flex-col bg-linear-to-b from-surface-default from-50% to-surface-brand-weak">
      <main className="flex flex-1 flex-col gap-10 pt-22.5">
        {/* 등록을 마치면 만나는 홈 화면을 미리 보인다. 아래쪽은 배경으로 스며들게 가린다 */}
        <div className="relative mx-9.5 h-78 overflow-hidden [mask-image:linear-gradient(to_bottom,black_36%,transparent)]">
          <Image
            src="/images/onboarding/intro-preview.png"
            alt="코코의 건강 고민을 덜어줄 맞춤 상품을 보여주는 홈 화면 미리보기"
            fill
            sizes="317px"
            priority
            className="object-cover object-top"
          />
        </div>

        <header className="flex flex-col gap-2 px-5 text-center">
          <h1 className="text-title-bold-20 text-foreground">딱 1분만 아이에 대해 알려주세요</h1>
          <p className="text-body-medium-16 text-text-body-secondary">
            건강 고민과 체질에 꼭 맞는 펫푸드만 골라서 추천해 드릴게요.
          </p>
        </header>
      </main>

      {/* 그라데이션이 버튼 뒤까지 이어져야 해서 바의 흰 배경을 지운다 */}
      <BottomActionBar className="bg-transparent">
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={onStart}>
          프로필 입력하기
        </Button>
      </BottomActionBar>
    </div>
  );
}
