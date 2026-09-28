// 상품 카드 사진 위의 찜 하트. 검색 결과(2396-80432·2396-80461)와 상품 상세의 "함께 보면 좋은
// 상품"(1716-34235)이 같은 모양이라 한 벌로 둔다 (#483).
//
// 시안은 사진 위에 바로 얹지 않고 어두운 원판(32px) 안에 24px 흰 하트를 놓는다. 원판은 이미지
// 모서리에서 4px 떨어져 있어(공용 기본값 top-3/right-3=12px보다 좁다) 부르는 쪽이
// `imageActionClassName="top-1 right-1"`을 준다. 44px 감싸는 버튼을 따로 두면 원판이 가운데
// 정렬되며 안쪽으로 밀려 4px이 아니게 되므로, 원판 자체를 버튼으로 쓰고 after:로 탭 영역만
// 44px로 넓힌다(32+6*2=44).

import { Icon } from "@/shared/ui/icon/icon";

type CardHeartButtonProps = {
  /** 상품 이름. 화면 낭독기가 "○○ 찜하기"로 읽는다 */
  name: string;
  wished: boolean;
  onToggle: () => void;
};

export function CardHeartButton({ name, wished, onToggle }: CardHeartButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={wished}
      aria-label={`${name} 찜하기`}
      className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-dimmed text-icon-fill-static-white after:absolute after:-inset-1.5"
    >
      {wished ? (
        <Icon name="heart_fill" aria-hidden className="size-6" />
      ) : (
        <Icon name="heart_stroke" aria-hidden className="size-6" />
      )}
    </button>
  );
}
