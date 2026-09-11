// 사진 리뷰 상세. 사진을 크게 보이고 그 사진이 달린 후기를 아래에 붙인다.
// 와이어프레임 기준(상품 상세_사진 리뷰 모음 화면_리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 사진을 보다 바로 살 수 있어야 해서 시안이 하단 CTA를 그대로 둔다. 사진이 마음에
// 들면 그 자리에서 상품으로 갈 수 있어야 한다.

"use client";

import { IoChevronBack, IoChevronForward, IoClose, IoImageOutline } from "react-icons/io5";

import { ReviewCard, type MockReview } from "@/entities/review";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

type PhotoViewerProps = {
  review: MockReview;
  photoIndex: number;
  onPhotoChange: (index: number) => void;
  onClose: () => void;
  onBuy: () => void;
};

export function PhotoViewer({
  review,
  photoIndex,
  onPhotoChange,
  onClose,
  onBuy,
}: PhotoViewerProps) {
  // 주소로 들어오면 범위를 벗어난 값이 올 수 있다
  const current = Math.min(Math.max(photoIndex, 0), review.photoCount - 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${review.nickname}의 사진 리뷰`}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background"
    >
      <header className="flex h-14 shrink-0 items-center px-2">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <IoClose aria-hidden className="size-6" />
        </button>
        <h2 className="flex-1 text-center text-base font-bold text-foreground">사진 리뷰</h2>
        {/* 제목을 가운데 두려고 닫기 버튼만큼 자리를 비운다 */}
        <span aria-hidden className="size-11" />
      </header>

      <div className="relative flex aspect-square w-full items-center justify-center bg-muted">
        <IoImageOutline aria-hidden className="size-12 text-muted-foreground" />

        {review.photoCount > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 사진"
              disabled={current === 0}
              onClick={() => onPhotoChange(current - 1)}
              className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-30"
            >
              <IoChevronBack aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              disabled={current === review.photoCount - 1}
              onClick={() => onPhotoChange(current + 1)}
              className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-30"
            >
              <IoChevronForward aria-hidden className="size-5" />
            </button>

            {/* 점 개수는 이 후기에 달린 사진 수다. 전체 장수를 넘기는 것이 아니다 */}
            <div className="absolute bottom-3 flex gap-1.5">
              <span className="sr-only">{`${review.photoCount}장 중 ${current + 1}번째`}</span>
              {Array.from({ length: review.photoCount }, (_, index) => (
                <span
                  key={index}
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    index === current ? "bg-foreground" : "bg-foreground/30",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 사진 아래에 그 사진을 남긴 후기가 온다. 사진만 보고는 왜 찍었는지 알 수 없다 */}
      <div className="flex-1 px-4 py-5">
        <ReviewCard review={review} />
      </div>

      <BottomActionBar>
        <Button className="min-h-11" onClick={onBuy}>
          상품 보러 가기
        </Button>
      </BottomActionBar>
    </div>
  );
}
