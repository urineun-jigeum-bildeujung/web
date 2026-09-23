// 작성한 리뷰 상세. UI 시안(사진 리뷰 상세, 943-15495)을 그대로 옮긴다 — X 닫기 헤더, 정사각 사진과 점,
// 닉네임·별점·날짜, 칩(아이 프로필·사용 기간), 후기 글. 시안의 신고하기·도움돼요 줄과 하단 구매 줄은
// props로 켠다 — 마이페이지의 내 리뷰는 끄고, 상품 쪽에서 남의 리뷰를 볼 때 켠다.
// 상품 상세의 사진 리뷰 뷰어(`views/product-photos/ui/photo-viewer.tsx`)와 같은 시안 계열이라
// 글자·칩 값은 그 뷰어가 쓰는 `ReviewCard`와 같게 맞췄다. 다른 점은 README에 적었다(#363).

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useQueryMyProfile } from "@/entities/member";
import { useQueryPetDetail } from "@/entities/pet";
import { useQueryReviewDetail, type ReviewDetail, type ReviewPet } from "@/entities/review";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Rating } from "@/shared/ui/rating/rating";
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";

import { toReviewDate, toReviewPetProfile, toUsageLabel } from "../model/review-labels";

/** 어디서 보느냐에 따라 켜고 끄는 줄. 마이페이지의 내 리뷰는 둘 다 끈다 */
type ReviewDetailOptions = {
  /** 신고하기·도움돼요 줄(시안 943-15543). 남의 리뷰를 볼 때 켠다 */
  showReactions?: boolean;
  /** 하단 찜·장바구니·바로 구매 줄(시안 943-15550). 상품 쪽에서 볼 때 켠다 */
  showPurchaseBar?: boolean;
};

type ReviewDetailViewProps = ReviewDetailOptions & {
  reviewId: string;
};

/** 받는 동안 잡아 둘 자리. 정사각 사진과 후기 머리 두 줄·본문 높이다 */
function ReviewDetailSkeleton() {
  return (
    <div role="status" aria-label="리뷰를 불러오는 중" className="flex flex-col">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 px-5 pt-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-18 w-full" />
      </div>
    </div>
  );
}

/**
 * 시안의 정사각 사진 자리. 여러 장이면 옆으로 밀어 넘기고 아래 점이 어느 장인지 보인다.
 * 시안(943-15517)의 점은 표시용이라 누르지 않는다 — 6px 점을 10px 간격으로 두면 터치 영역이 겹쳐
 * 엉뚱한 장으로 간다. 넘기기는 스크롤 스냅이 맡고, 키보드에는 초점이 올 때만 보이는 이전·다음 버튼을 둔다.
 */
function PhotoCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const track = useRef<HTMLUListElement>(null);

  const goTo = (index: number) => {
    const list = track.current;
    if (list) list.scrollTo({ left: list.clientWidth * index, behavior: "smooth" });
  };

  return (
    <div className="relative aspect-square w-full shrink-0 bg-muted">
      <ul
        ref={track}
        aria-label="후기 사진"
        onScroll={(event) => {
          const list = event.currentTarget;
          setCurrent(Math.round(list.scrollLeft / list.clientWidth));
        }}
        className="flex size-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto"
      >
        {images.map((src, index) => (
          <li key={src} className="relative size-full shrink-0 snap-start">
            <Image
              src={src}
              alt={`후기 사진 ${index + 1}번째`}
              fill
              sizes="(max-width: 420px) 100vw, 420px"
              className="object-cover"
              priority={index === 0}
            />
          </li>
        ))}
      </ul>

      {images.length > 1 && (
        <>
          {/* 시안에 없는 버튼이라 평소엔 화면 밖에 두고, 키보드 초점이 올 때만 보인다 */}
          <button
            type="button"
            aria-label="이전 사진"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
            className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-0"
          >
            <Icon name="left" aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            disabled={current === images.length - 1}
            onClick={() => goTo(current + 1)}
            className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-0"
          >
            <Icon name="right" aria-hidden className="size-5" />
          </button>
        </>
      )}

      {images.length > 1 && (
        // 시안(943-15517)의 점. 6px 원과 4px 간격
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          <span className="sr-only" aria-live="polite">
            {`${images.length}장 중 ${current + 1}번째`}
          </span>
          {images.map((src, index) => (
            <span
              key={src}
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                index === current ? "bg-foreground" : "bg-foreground/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReactionRow() {
  const [liked, setLiked] = useState(false);
  const [reporting, setReporting] = useState(false);

  return (
    <div className="flex items-center justify-between">
      {/* 신고는 되돌리기 어렵다. 누르는 순간 접수되는 것처럼 보이면 안 된다 */}
      <button
        type="button"
        onClick={() => setReporting(true)}
        className="flex min-h-11 items-center text-caption-regular-12 text-text-body-secondary underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        신고하기
      </button>

      <button
        type="button"
        aria-pressed={liked}
        onClick={() => setLiked((prev) => !prev)}
        className={cn(
          "relative flex h-8 items-center gap-1 rounded-lg border px-3 text-label-medium-12 transition-colors after:absolute after:inset-x-0 after:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          liked ? "border-brand text-brand" : "border-border text-icon-fill-secondary",
        )}
      >
        <Icon name="thumbs_up" aria-hidden className="size-5" />
        <span>{liked ? 1 : 0}</span>
        <span className="sr-only">이 후기가 도움이 됐어요</span>
      </button>

      <AlertDialog open={reporting} onOpenChange={setReporting}>
        <AlertDialogContent>
          <AlertDialogTitle>이 후기를 신고할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            확인 후 조치하며, 결과는 따로 알려드리지 않아요
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            {/* 신고 접수 API가 아직 없다. 계약이 정해지면 이 자리에서 부른다 */}
            <AlertDialogAction
              className="min-h-11"
              onClick={() => toast.success("신고가 접수됐어요")}
            >
              신고하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** 시안(943-15550)의 하단 줄. 장바구니·바로 구매는 옵션 시트가 상품 상세에 있어 그 화면으로 보낸다
    (사진 리뷰 뷰어와 같은 결정). 찜은 서버에 보낼 곳이 아직 없어 뷰어와 같이 화면 안에서만 켜진다 */
function PurchaseBar({ productId }: { productId: string }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const goToProduct = () => router.push(`/products/${productId}`);

  return (
    <BottomActionBar>
      <button
        type="button"
        aria-label={liked ? "찜 목록에서 빼기" : "찜 목록에 담기"}
        aria-pressed={liked}
        onClick={() => {
          setLiked(!liked);
          if (!liked) showSnackbar("해당 상품을 찜 목록에 담았어요!");
        }}
        className="flex size-12 flex-none! items-center justify-center rounded-2xl border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {liked ? (
          <Icon name="heart_fill" aria-hidden className="size-6 text-brand" />
        ) : (
          <Icon name="heart_stroke" aria-hidden className="size-6 text-icon-stroke-tertiary" />
        )}
      </button>
      <Button variant="secondary" className="h-12" onClick={goToProduct}>
        장바구니
      </Button>
      <Button className="h-12" onClick={goToProduct}>
        바로 구매
      </Button>
    </BottomActionBar>
  );
}

/**
 * 아이 칩 하나. 응답 스냅샷에는 품종명·몸무게가 없어 내 아이면 상세를 받아 "말티즈 · 8세 · 4kg"으로,
 * 못 받으면(남의 아이·지운 아이) 스냅샷의 이름과 나이로 "코코 · 8세"로 보인다
 */
function PetChip({ pet }: { pet: ReviewPet }) {
  const { pet: detail } = useQueryPetDetail(pet.id);
  return (
    <li className="rounded-sm bg-surface-secondary px-1.5 py-0.5 text-label-medium-12 text-text-body-secondary">
      {detail ? toReviewPetProfile(detail) : `${pet.name} · ${pet.age}세`}
    </li>
  );
}

function ReviewDetailContent({
  review,
  showReactions,
  showPurchaseBar,
}: ReviewDetailOptions & { review: ReviewDetail }) {
  // 응답에 닉네임이 없다(백엔드 요청 중). 마이페이지 아래라 내 리뷰가 전제이니 내 정보에서 채운다.
  // 아이 칩은 `isMine`으로 가리지 않는다 — 새로고침 직후엔 액세스 토큰이 아직 메모리에 없어 이 조회가
  // 인증 없이 나가고 `isMine`이 `false`로 온다. 내 아이가 아니면 스냅샷 값으로만 그린다
  const { profile } = useQueryMyProfile();
  const chips = [toUsageLabel(review.usageDays), ...review.goodPoints, ...review.badPoints];

  return (
    <>
      {review.images.length > 0 && <PhotoCarousel images={review.images} />}

      {/* 시안(943-15521)의 후기 묶음. 좌우 20px, 줄 사이 8px */}
      <article className="flex flex-1 flex-col gap-2 px-5 pt-4 pb-5">
        <p className="text-label-bold-14 text-text-body-default">{profile?.nickname}</p>

        <div className="flex items-center justify-between">
          <Rating value={review.rating} size="md" />
          <span className="text-label-medium-11 text-text-body-secondary">
            {toReviewDate(review.createdAt)}
          </span>
        </div>

        {/* 시안의 "[옵션] …" 줄은 응답에 옵션이 없어 두지 않는다 */}
        <ul aria-label="아이와 사용 기간, 반응" className="flex flex-wrap gap-2">
          {review.pets.map((pet) => (
            <PetChip key={pet.id} pet={pet} />
          ))}
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-sm bg-surface-secondary px-1.5 py-0.5 text-label-medium-12 text-text-body-secondary"
            >
              {chip}
            </li>
          ))}
        </ul>

        <p className="text-body-medium-14 whitespace-pre-line text-text-body-default">
          {review.content}
        </p>

        {showReactions && <ReactionRow />}
      </article>

      {showPurchaseBar && <PurchaseBar productId={review.product.id} />}
    </>
  );
}

export function ReviewDetailView({
  reviewId,
  showReactions,
  showPurchaseBar,
}: ReviewDetailViewProps) {
  const router = useRouter();
  const { review, isLoading, isRetrying, error, refetch } = useQueryReviewDetail(reviewId);
  // 지웠거나 주소가 틀린 것은 다시 시도해도 같다. 실패와 다르게 알린다
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안(943-15503)은 X로 닫는 헤더다. 제목은 시안의 "사진 리뷰" 대신 "리뷰 상세" — 사진 없는
          후기도 이 화면으로 온다 */}
      <PageHeader title="리뷰 상세" leading="close" onLeadingClick={() => router.back()} />

      <main className="flex flex-1 flex-col">
        {isLoading ? (
          <ReviewDetailSkeleton />
        ) : notFound ? (
          <EmptyState
            icon={<Icon name="review" />}
            title="리뷰를 찾을 수 없어요"
            description="이미 삭제되었거나 주소가 바뀌었을 수 있어요"
            className="flex-1"
          />
        ) : error || !review ? (
          <EmptyState
            icon={<Icon name="review" />}
            title="리뷰를 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요"
            className="flex-1"
            action={
              <Button variant="outline" disabled={isRetrying} onClick={() => void refetch()}>
                <LoadingSwap loading={isRetrying} label="리뷰를 다시 불러오는 중">
                  다시 시도
                </LoadingSwap>
              </Button>
            }
          />
        ) : (
          <ReviewDetailContent
            review={review}
            showReactions={showReactions}
            showPurchaseBar={showPurchaseBar}
          />
        )}
      </main>
    </div>
  );
}
