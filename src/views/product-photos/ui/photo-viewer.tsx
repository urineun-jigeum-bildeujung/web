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
import { useEffect, useRef } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { useToggleWishlist } from "@/features/toggle-wishlist";
import {
  ReviewCard,
  toRepurchaseLabels,
  toUsageLabel,
  useMutateReviewRecommend,
  useQueryReviewDetail,
} from "@/entities/review";
import { useQueryWishlistStatus } from "@/entities/wishlist";
import { formatDisplayFullDate } from "@/shared/lib/date/display-date";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { HeaderBackButton } from "@/shared/ui/page-header/header-back-button";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";

type PhotoViewerProps = {
  /** 이 사진 모음의 상품. 하단 하트가 이 상품의 찜을 켜고 끈다 */
  productId: number;
  reviewId: string;
  /** 이 후기의 사진 중 몇 번째. 주소로 들어오면 범위를 벗어난 값이 올 수 있다 */
  photoIndex: number;
  onPhotoChange: (index: number) => void;
  onClose: () => void;
  onBuy: () => void;
};

export function PhotoViewer({
  productId,
  reviewId,
  photoIndex,
  onPhotoChange,
  onClose,
  onBuy,
}: PhotoViewerProps) {
  const { review, isLoading } = useQueryReviewDetail(reviewId);
  // 도움돼요는 리뷰 탭의 카드와 같은 캐시를 함께 바꾼다 (#606)
  const recommend = useMutateReviewRecommend();

  // 찜은 서버에 저장한다(#483). 가격을 몰라 좋아요 탭 목록에 먼저 넣을 줄은 넘기지 않고
  // 재동기화에 맡긴다. 장바구니·바로구매는 옵션 시트와 가격이 상품 상세 슬라이스에 있어
  // 여기서 그대로 재사용하면 FSD의 같은 레이어(views) 간 참조 금지에 걸린다 — 지금은 상품
  // 상세로 이동만 시키고, 그 데이터가 entities로 내려올 때 이 화면도 같이 실제 동작으로 올린다
  const heart = useToggleWishlist();
  const wishStatus = useQueryWishlistStatus(productId, { enabled: heart.signedIn });
  const liked = wishStatus.wished ?? false;

  const images = review?.images ?? [];
  const current = images.length > 0 ? Math.min(Math.max(photoIndex, 0), images.length - 1) : 0;

  const track = useRef<HTMLUListElement>(null);

  // **지금 어디인지는 React 상태가 아니라 줄의 실제 위치에서 읽는다.** `current`는 주소에서
  // 오는 값이라 다시 그려진 뒤에야 바뀌는데, 화살표를 연달아 누르면 그 사이에 다음 누름이
  // 들어와 같은 곳을 두 번 가리킨다. 미끄러뜨리지 않고 자리를 바로 옮기는 것도 같은 이유다 —
  // 애니메이션이 끝나기 전에 다음 누름이 오면 중간 위치를 현재로 읽는다.
  // 화살표는 키보드 초점에서만 나오므로 손으로 넘길 때의 부드러움은 그대로다 (리뷰 반영)
  const goTo = (step: -1 | 1) => {
    const list = track.current;
    if (!list || list.clientWidth === 0) return;

    const at = Math.round(list.scrollLeft / list.clientWidth);
    const next = Math.min(Math.max(at + step, 0), images.length - 1);

    list.scrollLeft = list.clientWidth * next;
    onPhotoChange(next);
  };

  // 격자에서 고른 사진이 첫 장이 아닐 수 있고, 주소로 바로 들어올 수도 있다.
  // 사진을 받아 온 뒤에야 줄이 그려지므로 그 시점에 자리를 맞춘다.
  // **애니메이션 없이 건너뛴다** — 열자마자 첫 장에서 훑고 지나가면 엉뚱한 사진을 본다
  useEffect(() => {
    const list = track.current;
    if (list) list.scrollLeft = list.clientWidth * current;
    // 고른 사진이 바뀔 때마다 미끄러뜨리면 스크롤과 서로를 밀어낸다. 줄이 처음
    // 그려질 때(사진 수가 정해질 때)만 맞춘다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        // 기본은 가운데 뜨는 작은 모달이다. 시안은 전체화면이라 자리와 크기를 덮는다.
        // **`sm:max-w-none`이 함께 있어야 한다** — 베이스가 `sm:max-w-sm`이라 같은 접두사로
        // 덮지 않으면 640px 이상에서 384px로 남는다(tailwind-merge는 변형이 다르면 안 합친다)
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-y-auto rounded-none p-0 ring-0 sm:max-w-none"
      >
        {/* 시안(1758-54280)은 공용 header에 뒤로가기 화살표와 "사진 리뷰"다. X가 아니다 — 모든 헤더와
            같은 PageHeader를 쓰고, 다이얼로그라 누르면 닫는다(#513). 제목은 다이얼로그의 이름이라
            DialogTitle로 넘긴다 */}
        <PageHeader
          className="shrink-0"
          left={
            <DialogClose asChild>
              <HeaderBackButton aria-label="닫기" />
            </DialogClose>
          }
          title={
            <DialogTitle className="truncate text-center text-title-bold-18 text-text-body-default">
              사진 리뷰
            </DialogTitle>
          }
        />

        <DialogDescription className="sr-only">
          {images.length > 0 ? `이 후기에 달린 사진 ${images.length}장` : "후기 사진을 불러오는 중"}
        </DialogDescription>

        <div className="relative aspect-square w-full shrink-0 bg-muted">
          {/* 넘기는 것은 스크롤 스냅이 맡는다 — 시안(1758-54280)에 좌우 화살표가 없다.
              리뷰 상세의 사진 줄과 같은 방식이고, 지금 몇 번째인지는 스크롤 위치에서
              되읽는다. 따로 상태를 굴리면 손가락으로 넘긴 것과 표시가 어긋난다 */}
          <ul
            ref={track}
            aria-label="후기 사진"
            onScroll={(event) => {
              const list = event.currentTarget;
              // 창이 닫히는 중이거나 아직 자리를 못 잡았으면 폭이 0이다. 그대로 나누면
              // `NaN`이 나오고 `NaN !== current`는 늘 참이라 주소에 `NaN`이 박힌다 (리뷰 반영)
              if (list.clientWidth === 0) return;
              const next = Math.round(list.scrollLeft / list.clientWidth);
              // 주소(`n`)와 이어져 있어 실제로 바뀔 때만 알린다
              if (next !== current) onPhotoChange(next);
            }}
            className="flex size-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, index) => (
              <li key={src} className="relative size-full shrink-0 snap-start">
                <Image
                  src={src}
                  alt={`후기 사진 ${index + 1}번째`}
                  fill
                  // 열자마자 보는 이 화면의 주인공이다
                  preload={index === current}
                  sizes="100vw"
                  className="object-contain"
                />
              </li>
            ))}
          </ul>

          {images.length > 1 && (
            <>
              {/* 시안에 없는 버튼이라 평소엔 안 보이고 키보드 초점이 올 때만 나온다 —
                  넘기기를 스크롤에만 맡기면 키보드로는 넘길 수 없다 */}
              <button
                type="button"
                aria-label="이전 사진"
                disabled={current === 0}
                onClick={() => goTo(-1)}
                className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-0"
              >
                <IoChevronBack aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                aria-label="다음 사진"
                disabled={current === images.length - 1}
                onClick={() => goTo(1)}
                className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-0"
              >
                <IoChevronForward aria-hidden className="size-5" />
              </button>

              {/* 시안은 점이 아니라 사진 우측 하단의 어두운 알약 안 `1/3`이다.
                  세는 것은 이 후기에 달린 사진 수이지 전체 장수가 아니다.
                  **낭독기에는 `1/3`을 그대로 들려주지 않는다** — 분수로도 날짜로도 읽혀서다 */}
              <p className="absolute right-1 bottom-1 rounded-full bg-foreground/50 px-2 py-0.5 text-label-medium-12 text-text-body-static-white">
                <span className="sr-only">{`${images.length}장 중 ${current + 1}번째`}</span>
                <span aria-hidden>
                  {current + 1}/{images.length}
                </span>
              </p>
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
                tags: [
                  toUsageLabel(review.usageDays),
                  ...toRepurchaseLabels(review.repurchaseCount),
                ],
                content: review.content,
                likeCount: review.likeCount,
                liked: review.liked,
              }}
              hidePhotos
              onToggleLike={(liked) => recommend.toggle(review.id, liked)}
            />
          )}
        </div>

        <BottomActionBar className="*:text-label-bold-14">
          <button
            type="button"
            aria-label={liked ? "찜 목록에서 빼기" : "찜 목록에 담기"}
            aria-pressed={liked}
            // 찜 여부를 받는 동안은 누를 수 없다 — PATCH가 토글이라 모르는 채로 누르면 서버의 찜이 지워진다(#493 리뷰). 받은 뒤에는 낙관적 갱신이라 누르는 즉시 바뀐다
            disabled={wishStatus.isLoading}
            onClick={() => {
              if (heart.toggle(productId, !liked) && !liked) {
                showSnackbar("해당 상품을 찜 목록에 담았어요!");
              }
            }}
            className="flex size-11 flex-none! items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <LoadingSwap
              loading={wishStatus.isLoading}
              label="찜 여부를 불러오는 중"
              spinnerClassName="size-5"
            >
              {liked ? (
                <Icon name="heart_fill" aria-hidden className="size-6 text-brand" />
              ) : (
                <Icon
                  name="heart_stroke"
                  aria-hidden
                  className="size-6 text-icon-stroke-tertiary"
                />
              )}
            </LoadingSwap>
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
