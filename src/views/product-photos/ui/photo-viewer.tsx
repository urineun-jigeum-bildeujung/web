// 사진 리뷰 상세. 사진을 크게 보이고 그 사진이 달린 후기를 아래에 붙인다.
// 와이어프레임 기준(상품 상세_사진 리뷰 모음 화면_리뷰 탭)이라 디자인 확정 시 바뀔 수 있다.
//
// 사진을 보다 바로 살 수 있어야 해서 시안이 하단 CTA를 그대로 둔다. 사진이 마음에
// 들면 그 자리에서 상품으로 갈 수 있어야 한다.
//
// **카드는 공개 리뷰 상세로 채운다.** 격자가 보는 `/photos`는 `{ reviewId, imageUrl }`뿐이라
// 카드에 그릴 것이 없다. 이름 줄과 도움돼요 수는 그 응답이 준다.
//
// 열고 닫는 껍데기는 shadcn Dialog에 맡긴다. `role="dialog"`를 손으로 붙이면
// 포커스가 뒤 화면에 남고 Esc도 듣지 않는다 — 눈에 보이지 않아 놓치기 쉬운 부분이다.

"use client";

import Image from "next/image";
import { useState } from "react";
import { IoChevronBack, IoChevronForward, IoClose } from "react-icons/io5";

import { ReviewCard, toUsageLabel, useQueryReviewDetail } from "@/entities/review";
import { cn } from "@/shared/lib/utils";
import { formatDisplayFullDate } from "@/shared/lib/date/display-date";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";

type PhotoViewerProps = {
  reviewId: string;
  /** 이 후기의 사진 중 몇 번째. 주소로 들어오면 범위를 벗어난 값이 올 수 있다 */
  photoIndex: number;
  onPhotoChange: (index: number) => void;
  onClose: () => void;
  onBuy: () => void;
};

export function PhotoViewer({
  reviewId,
  photoIndex,
  onPhotoChange,
  onClose,
  onBuy,
}: PhotoViewerProps) {
  const { review, isLoading } = useQueryReviewDetail(reviewId);

  // 찜은 이 화면 안에서 끝나는 상태라 진짜로 토글한다. 장바구니·바로구매는 옵션 시트와
  // 가격이 상품 상세 슬라이스에 있어 여기서 그대로 재사용하면 FSD의 같은 레이어(views)
  // 간 참조 금지에 걸린다 — 지금은 상품 상세로 이동만 시키고, 그 데이터가
  // entities로 내려올 때 이 화면도 같이 실제 동작으로 올린다
  const [liked, setLiked] = useState(false);

  const images = review?.images ?? [];
  const current = images.length > 0 ? Math.min(Math.max(photoIndex, 0), images.length - 1) : 0;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        // 기본은 가운데 뜨는 작은 모달이다. 시안은 전체화면이라 자리와 크기를 덮는다.
        // **`sm:max-w-none`이 함께 있어야 한다** — 베이스가 `sm:max-w-sm`이라 같은 접두사로
        // 덮지 않으면 640px 이상에서 384px로 남는다(tailwind-merge는 변형이 다르면 안 합친다)
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-y-auto rounded-none p-0 ring-0 sm:max-w-none"
      >
        {/* 시안(1758-54280)의 헤더는 48px, 제목은 18px 굵게다 */}
        <header className="flex h-12 shrink-0 items-center px-2">
          <DialogClose asChild>
            <button
              type="button"
              aria-label="닫기"
              className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IoClose aria-hidden className="size-6" />
            </button>
          </DialogClose>
          <DialogTitle className="flex-1 text-center text-title-bold-18 text-text-body-default">
            사진 리뷰
          </DialogTitle>
          {/* 제목을 가운데 두려고 닫기 버튼만큼 자리를 비운다 */}
          <span aria-hidden className="size-11" />
        </header>

        <DialogDescription className="sr-only">
          {images.length > 0 ? `이 후기에 달린 사진 ${images.length}장` : "후기 사진을 불러오는 중"}
        </DialogDescription>

        <div className="relative flex aspect-square w-full shrink-0 items-center justify-center bg-muted">
          {images.length > 0 && (
            <Image
              src={images[current]}
              alt={`후기 사진 ${current + 1}번째`}
              fill
              // 열자마자 보는 이 화면의 주인공이다
              priority
              sizes="100vw"
              className="object-contain"
            />
          )}

          {images.length > 1 && (
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
                disabled={current === images.length - 1}
                onClick={() => onPhotoChange(current + 1)}
                className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-30"
              >
                <IoChevronForward aria-hidden className="size-5" />
              </button>

              {/* 점 개수는 이 후기에 달린 사진 수다. 전체 장수를 넘기는 것이 아니다 */}
              <div className="absolute bottom-3 flex gap-1.5">
                <span className="sr-only">{`${images.length}장 중 ${current + 1}번째`}</span>
                {images.map((url, index) => (
                  <span
                    key={url}
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

        {/* 사진 아래에 그 사진을 남긴 후기가 온다. 사진만 보고는 왜 찍었는지 알 수 없다.
            처음 그리는 자리라 대기 표시는 Skeleton이다 — 이미 그려진 UI가 기다리는 것이 아니다 */}
        <div className="flex-1 px-4 py-5">
          {isLoading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {!isLoading && !review && (
            <EmptyState title="후기를 불러오지 못했어요" className="py-8" />
          )}

          {review && (
            <ReviewCard
              review={{
                id: review.id,
                nickname: review.nickname,
                pets: review.pets,
                rating: review.rating,
                // 서버가 주는 날짜는 전부 shared/lib/date를 거친다
                date: formatDisplayFullDate(review.createdAt) ?? "",
                images: review.images,
                // 목록 배지와 같은 문구를 쓴다
                tags: [toUsageLabel(review.usageDays)],
                content: review.content,
                likeCount: review.likeCount,
                liked: review.liked,
              }}
              hidePhotos
            />
          )}
        </div>

        <BottomActionBar className="*:text-label-bold-14">
          <button
            type="button"
            aria-label={liked ? "찜 목록에서 빼기" : "찜 목록에 담기"}
            aria-pressed={liked}
            onClick={() => {
              setLiked(!liked);
              if (!liked) showSnackbar("해당 상품을 찜 목록에 담았어요!");
            }}
            className="flex size-11 flex-none! items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {liked ? (
              <Icon name="heart_fill" aria-hidden className="size-6 text-brand" />
            ) : (
              <Icon name="heart_stroke" aria-hidden className="size-6 text-icon-stroke-tertiary" />
            )}
          </button>
          <Button variant="secondary" className="min-h-11" onClick={onBuy}>
            장바구니
          </Button>
          <Button className="min-h-11" onClick={onBuy}>
            바로 구매
          </Button>
        </BottomActionBar>
      </DialogContent>
    </Dialog>
  );
}
