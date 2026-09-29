// 상품 상세 화면.
// 와이어프레임 기준(상품상세)이며 섹션 라벨이 아직 `수정 진행 예정`이라 바뀔 수 있다.
//
// 위에서부터 상품 자체 → 우리 아이에게 맞는지 → 함께 볼 것 → 자세한 정보 순으로 놓인다.
// 적합도를 가격 바로 아래 두는 것이 이 화면의 뜻이다. 스펙을 다 읽고 나서야
// 판단하게 하지 않고, 살지 말지를 정하는 자리에서 근거를 먼저 보인다.
//
// 상품 자체(이름·가격·별점·품절·스펙)는 `GET /products/{id}`의 실데이터다(#413).
// 적합도·영양 분석은 서버가 계산해 내려줄 값이라 지금도 `model/mock-product`의 목이다(#123).

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, use, useEffect, useState } from "react";
import { toast } from "sonner";

import { CartLink } from "@/widgets/cart-link";
import { NotificationBell } from "@/widgets/notification-bell";
import {
  CardHeartButton,
  toWishlistItem,
  useToggleWishlist,
  useWishedProductIds,
} from "@/features/toggle-wishlist";
import { useMutateCartItem } from "@/entities/cart";
import { useQueryPetDetail, useQueryPets } from "@/entities/pet";
import { formatUnitPrice, type ProductCard, type ProductDetail } from "@/entities/product";
import { useQueryWishlistStatus } from "@/entities/wishlist";
import { useSessionState } from "@/shared/api/use-session-state";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { ErrorBoundary } from "@/shared/ui/error-boundary/error-boundary";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar, SNACKBAR_CLASS, SNACKBAR_OPTIONS } from "@/shared/ui/snackbar/snackbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { MOCK_INQUIRIES } from "../model/mock-inquiries";
import { DEAL_ENDS_AT, MOCK_PRODUCT } from "../model/mock-product";
import { EXAMPLE_MATCH_WITHOUT_PET, toPetMatch } from "../model/pet-match";
import { DetailOptionSheet } from "./detail-option-sheet";
import { MatchPanel } from "./match-panel";
import { ProductInfoPanel } from "./product-info-panel";
import { QnaPanel } from "./qna-panel";
import { ReviewPanel } from "./review-panel";

const TABS = ["info", "review", "qna"] as const;

// QA용. `?status=`로 덮어써 일반/타임딜/품절을 새로고침 없이 확인한다.
//
// **개발 빌드에서만 듣는다.** 서버가 품절이라고 해도 `?status=normal`을 붙이면 구매
// 버튼이 되살아나므로, 실데이터가 붙은 뒤로는 운영에 나가면 안 되는 장치다
// (views/deals의 개발용 버튼과 같은 판단이다)
const STATUS_OVERRIDES = ["normal", "deal", "soldout"] as const;

const TAB_LABEL = [
  ["info", "상품 정보"],
  ["review", "리뷰"],
  ["qna", "Q&A"],
] as const;

/** 별점·후기 수 한 줄. 시안이 별 다섯 개짜리 줄 대신 별 하나 + 숫자로 그린다
    (상품 제목 아래·연관 상품 카드 둘 다 같은 모양이다) */
function RatingSummary({
  rating,
  reviewCount,
  onReviewClick,
}: {
  /** 평가가 없으면 null로도 온다. 아래 hasRating이 그 경우까지 함께 가린다 */
  rating: number | null;
  reviewCount: number;
  /** 있으면 "후기" 부분이 버튼이 된다(상품 제목 아래는 리뷰 탭으로 이동, 카드는 정보만 보여준다) */
  onReviewClick?: () => void;
}) {
  /**
   * **후기 수로 판단한다.** 백엔드 `Product.avgRating`은 컬럼이 nullable인데 자바 기본값이
   * `BigDecimal.ZERO`라, 리뷰가 없는 상품이 `null`로도 `0`으로도 올 수 있다. 값으로 보면
   * 어느 쪽이 올지에 따라 화면이 달라지므로 후기 수를 본다.
   */
  const hasRating = reviewCount > 0 && rating !== null;

  return (
    <span className="flex items-center gap-2">
      {/* 평가가 없으면 별은 회색으로 남기고 숫자를 적지 않는다. `0.0`으로 두면 아직 아무도
          평가하지 않은 상품이 평이 나쁜 상품처럼 읽힌다 — 적합도에서 점수를 못 매긴 상품을
          0점이 아니라 "정보 확인 중"으로 둔 것과 같은 판단이다(#119). 시안에 없는 상태라
          PD 확인 대기 */}
      <span className="flex items-center gap-0.5">
        <Icon
          name="star"
          className={cn("size-5", hasRating ? "text-icon-fill-accent" : "text-icon-fill-disable")}
        />
        {hasRating && (
          <span className="text-body-medium-14 text-text-body-secondary">{rating.toFixed(1)}</span>
        )}
      </span>
      {hasRating && <span aria-hidden className="h-4 w-px bg-border" />}
      {onReviewClick ? (
        // min-h-11를 그대로 주면 44px 박스가 레이아웃 높이 자체를 늘려 별점 줄과 다음
        // 줄 사이가 시안보다 벌어진다. 보이는 줄은 시안 높이 그대로 두고 누르는 자리만
        // after로 44px까지 넓힌다(적합도 드롭다운에 쓴 것과 같은 방식)
        <button
          type="button"
          onClick={onReviewClick}
          className="relative flex items-center text-body-medium-14 text-text-body-secondary after:absolute after:inset-x-0 after:-inset-y-2.75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          후기 {reviewCount}
        </button>
      ) : (
        <span className="text-body-medium-14 text-text-body-secondary">후기 {reviewCount}</span>
      )}
    </span>
  );
}

/** 상품 사진. 좌우로 넘기고 아래 점이 지금 몇 번째인지 알린다 */
function ProductImages({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-muted">
        <span className="text-sm text-muted-foreground">상품 이미지</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        // 스냅으로 한 장씩 멈춘다. 지금 몇 번째인지는 스크롤 위치에서 되읽는다 —
        // 따로 상태를 굴리면 손가락으로 넘긴 것과 점이 어긋난다
        onScroll={(event) => {
          const el = event.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, imageIndex) => (
          <div key={src} className="relative aspect-square w-full shrink-0 snap-center">
            <Image
              src={src}
              // 첫 장이 이 화면의 LCP다. 나머지는 넘겨야 보이므로 lazy로 둔다
              preload={imageIndex === 0}
              alt={imageIndex === 0 ? name : `${name} 사진 ${imageIndex + 1}`}
              fill
              sizes="(max-width: 420px) 100vw, 420px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <span aria-hidden className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((src, dotIndex) => (
            <span
              key={src}
              className={cn(
                "size-1.5 rounded-full",
                dotIndex === index ? "bg-foreground" : "bg-muted-foreground/40",
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
}

/** 한 화면 높이만큼 내려야 나타나는 맨 위로 가기 버튼. 하단 버튼 바로 위 20px에 뜬다 */
function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    // fixed는 실제 브라우저 뷰포트 기준이라, 화면 폭을 420px로 묶는 루트 레이아웃의
    // mx-auto 기둥과는 무관하다. 좁은 화면 밖(데스크톱 등)에서는 이 뼈대로 기둥 폭을
    // 맞추고, 실제 버튼은 그 안에서 시안대로 오른쪽 20px에 절대 위치시킨다
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 mx-auto max-w-105">
      <button
        type="button"
        aria-label="맨 위로"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="pointer-events-auto absolute right-5 bottom-0 flex size-11 items-center justify-center rounded-full bg-brand shadow-[0px_2px_6px_rgba(42,48,56,0.09),0px_4px_15px_rgba(42,48,56,0.06)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {/* 세트에 없는 화살표 모양이라(위쪽 chevron과 다른, 대 있는 화살표) 실제 자산을 그대로 쓴다 */}
        <Image
          src="/images/product-detail/scroll-top-icon.svg"
          alt=""
          width={24}
          height={24}
          unoptimized
        />
      </button>
    </div>
  );
}

type ProductDetailViewProps = {
  productId: string;
  /** 라우트가 서버에서 받아 온 상품 한 건 */
  product: ProductDetail;
  /** "함께 보면 좋은 상품". 라우트가 기다리지 않고 넘긴다(`getRelatedProducts`) */
  relatedPromise: Promise<ProductCard[]>;
};

/**
 * "함께 보면 좋은 상품". 인기순 실제 상품에서 지금 상품을 뺀 것이다 (#481).
 *
 * 예시 상품 셋을 그리던 동안에는 없는 상품이라 누를 수 없게 막아 두었다. AI 추천이 붙기 전까지는
 * 인기순으로 채운다. 볼 것이 없으면 칸과 아래 구분선을 함께 그리지 않는다.
 */
function RelatedProducts({ productsPromise }: { productsPromise: Promise<ProductCard[]> }) {
  const related = use(productsPromise);
  // 찜은 서버에 저장한다(#483). 검색 결과와 같이 전체 찜 목록으로 하트를 채운다
  const heart = useToggleWishlist();
  const { wishedIds, isLoading: isLoadingWishes } = useWishedProductIds();

  if (related.length === 0) {
    return null;
  }

  return (
    <>
      <section aria-labelledby="related-heading" className="flex flex-col gap-3 p-5">
        <h2 id="related-heading" className="text-title-bold-20 text-text-body-default">
          함께 보면 좋은 상품
        </h2>
        <ScrollRow label="함께 보면 좋은 상품" itemWidth="45%">
          {related.map((item) => (
            <ScrollRowItem key={item.productId}>
              <ProductGridCard
                href={`/products/${item.productId}`}
                name={item.name}
                price={item.price}
                originalPrice={item.originalPrice ?? undefined}
                discountRate={item.discountRate}
                imageUrl={item.thumbnailUrl ?? undefined}
                priceClassName="text-title-bold-16"
                // 시안(1716-34235)의 찜 자리는 검색 결과와 같이 사진 오른쪽 위(4px 인셋)의
                // 어두운 원판이다. 예전 시안(1716-34241)은 오른쪽 아래 흰 원이었다 (#483)
                imageActionClassName="top-1 right-1"
                imageAction={
                  <CardHeartButton
                    name={item.name}
                    wished={wishedIds.has(item.productId)}
                    loading={isLoadingWishes}
                    onToggle={() =>
                      heart.toggle(
                        item.productId,
                        !wishedIds.has(item.productId),
                        toWishlistItem(item),
                      )
                    }
                  />
                }
                meta={
                  <span className="flex flex-col gap-1">
                    <span className="text-caption-regular-12 text-text-body-tertiary">
                      {formatUnitPrice(item.unitLabel, item.unitPrice)}
                    </span>
                    <RatingSummary rating={item.rating} reviewCount={item.reviewCount} />
                  </span>
                }
              />
            </ScrollRowItem>
          ))}
        </ScrollRow>
      </section>
      <div className="h-2 bg-muted" />
    </>
  );
}

/** 인기순 목록을 받는 동안 칸 자리를 잡는다. 늦게 끼어들면 아래 탭이 밀린다 */
function RelatedProductsSkeleton() {
  return (
    <>
      <div
        role="status"
        aria-label="함께 보면 좋은 상품을 불러오는 중"
        className="flex flex-col gap-3 p-5"
      >
        <Skeleton className="h-7 w-44" />
        <div className="flex gap-3">
          <Skeleton className="aspect-square w-9/20 rounded-lg" />
          <Skeleton className="aspect-square w-9/20 rounded-lg" />
        </div>
      </div>
      <div className="h-2 bg-muted" />
    </>
  );
}

export function ProductDetailView({ productId, product, relatedPromise }: ProductDetailViewProps) {
  const router = useRouter();
  const { add, isAdding } = useMutateCartItem();
  // 고른 탭에 따라 보이는 것이 통째로 달라진다. nuqs 기본은 replace라
  // 그대로 두면 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("info").withOptions({ history: "push" }),
  );

  const [petId, setPetId] = useState<string | null>(null);
  // 찜은 서버에 저장한다(#483). 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도
  // 뜨지 않았다. 로그인하지 않았으면 누를 때 로그인으로 보낸다
  const heart = useToggleWishlist();
  const wishStatus = useQueryWishlistStatus(product.productId, { enabled: heart.signedIn });
  const liked = wishStatus.wished ?? false;
  const toggleLike = () => {
    const next = !liked;
    // 좋아요 탭 목록에 먼저 넣을 줄. 찜 목록은 정상가로 오므로 딜가가 붙은 타임딜 상세면 넣지 않고
    // 재동기화에 맡긴다 — 넣으면 좋아요 탭에 딜가가 잠깐 보인다
    const item = product.timeDealItemId
      ? undefined
      : toWishlistItem({
          productId: product.productId,
          name: product.name,
          thumbnailUrl: product.images[0] ?? null,
          price: product.price,
          originalPrice: product.originalPrice,
        });
    if (heart.toggle(product.productId, next, item) && next) {
      showSnackbar("해당 상품을 찜 목록에 담았어요!");
    }
  };
  const [optionSheetOpen, setOptionSheetOpen] = useState(false);
  // 시안(타임딜 1702-18698, 품절 1702-19204·19653)을 보여주는 자리. 실제로는
  // 상품 상태와 타임딜 종료 시각을 서버가 준다(#123)
  const [dealOver, setDealOver] = useState(false);
  const [statusOverride] = useQueryState("status", parseAsStringLiteral(STATUS_OVERRIDES));
  // 운영 빌드에서는 주소에 무엇을 적든 듣지 않는다
  const devStatusOverride = process.env.NODE_ENV === "production" ? null : statusOverride;
  // 타임딜 배지·카운트다운은 종료 시각이 상세 응답에 없어 아직 목이다(#413 범위 밖).
  // 그래서 실데이터로는 정상·품절만 판정하고, 타임딜 화면은 개발 오버라이드로만 본다.
  // **장바구니에 담는 식별자는 다르다** — 그건 아래에서 timeDealItemId로 가린다
  const status = devStatusOverride ?? (product.soldOut ? "soldout" : "normal");
  const isDealActive = status === "deal" && !dealOver;
  const isSoldOut = status === "soldout";

  // **적합도는 내 아이 기준이다.** 예시 아이("소리")를 그리던 동안 내 아이가 누구든 남의 이름이
  // 근거에까지 박혀 떴다 (#481). 고르기 전에는 기본 아이다(목록이 기본 아이를 앞에 둔다).
  // 로그인하지 않았으면 아이를 모르니 부르지 않고 적합도 칸도 그리지 않는다.
  //
  // 이름·프로필·알레르기 근거는 아이 상세에서, 점수·성분은 AI가 붙기 전까지 예시다(`toPetMatch`)
  const session = useSessionState();
  const petList = useQueryPets({ enabled: session === true });
  const { pets } = petList;
  const selectedPetId = session === true ? (petId ?? pets?.[0]?.id) : undefined;
  const petDetail = useQueryPetDetail(selectedPetId);
  const match = petDetail.pet ? toPetMatch(petDetail.pet, product.detail) : null;
  // 로그인 여부를 아직 모르거나 아이를 받는 중이면 자리를 잡는다. 늦게 끼어들면 아래가 통째로 밀린다
  const isWaitingMatch = session === null || petList.isLoading || petDetail.isLoading;
  // 로그인했는데 아이를 받지 못했으면 그 자리에서 알린다. 조용히 비우면 로그아웃과 구별되지 않는다
  const matchFailed = session === true && Boolean(petList.error ?? petDetail.error);
  const retryMatch = () => void (petList.error ? petList.refetch() : petDetail.refetch());

  // 타임딜 진행 중인 상품은 장바구니가 딜 아이템으로 받아야 딜가가 붙는다.
  // 상세에서 담을 때만 정가로 들어가던 자리다
  const cartItemRef = product.timeDealItemId
    ? ({ itemType: "TIME_DEAL", itemId: product.timeDealItemId } as const)
    : ({ itemType: "NORMAL", itemId: product.productId } as const);

  // 옵션은 없는 개념이다(#137). 고르는 값이 아니라 지금 담는 것이 무엇인지 알리는 표기다
  const netQuantityLabel = product.detail.netQuantityValue
    ? `${product.detail.netQuantityValue}${product.detail.netQuantityUnit}`
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        right={
          // 시안(공용 header)이 알림·장바구니 두 아이콘을 함께 둔다. 홈 화면 헤더와
          // 같은 아이콘·터치 영역 방식이다(보이는 자리 28px, 안 보이는 자리만 넓힘)
          <>
            <NotificationBell />
            <CartLink />
          </>
        }
      />

      <main className="flex flex-1 flex-col">
        <ProductImages images={product.images} name={product.name} />

        <section aria-labelledby="product-heading" className="flex flex-col gap-4 p-5">
          {/* 제목 줄과 가격 줄 사이는 12px, 이 둘 다음(타임딜 배너나 배송표)까지는
              16px — 시안이 이 둘을 다르게 그려서 따로 묶는다 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {isDealActive && (
                  <span className="w-fit rounded bg-surface-info px-1 py-0.5 text-label-bold-12 text-text-body-static-white">
                    타임딜
                  </span>
                )}
                {isSoldOut && (
                  <span className="w-fit rounded bg-surface-primary px-1 py-0.5 text-label-bold-12 text-text-body-inverse">
                    품절
                  </span>
                )}
                <h1 id="product-heading" className="text-title-bold-20 text-text-body-default">
                  {product.name}
                </h1>
                {/* 리뷰는 이 화면의 탭이다. 다른 화면으로 보내지 않고 탭만 바꾼다 */}
                <RatingSummary
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  onReviewClick={() => void setTab("review")}
                />
              </div>

              <button
                type="button"
                aria-label="공유하기"
                // 복사한 척만 하면 사용자는 붙여넣을 것이 없는 채로 나간다.
                // 안전한 문맥이 아니면 clipboard가 아예 없으므로 실패도 알린다
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    showSnackbar("링크를 복사했어요");
                  } catch {
                    showSnackbar("링크를 복사하지 못했어요");
                  }
                }}
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-icon-fill-secondary transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Icon name="share" aria-hidden className="size-6" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Price
                amount={product.price}
                originalAmount={product.originalPrice ?? undefined}
                discountRate={product.discountRate}
                size="lg"
              />
              <Button
                variant="default"
                className="min-h-11 shrink-0 px-2 text-label-bold-14"
                onClick={() =>
                  toast.custom(
                    (toastId) => (
                      <div role="status" className={cn(SNACKBAR_CLASS, "justify-between gap-2")}>
                        <span className="text-body-medium-14">상품이 비교하기에 담겼어요</span>
                        <button
                          type="button"
                          onClick={() => {
                            toast.dismiss(toastId);
                            router.push(
                              `/compare?slot=0&product=${encodeURIComponent(productId)}&from=detail`,
                            );
                          }}
                          className="shrink-0 rounded-sm text-label-bold-14 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          확인하기
                        </button>
                      </div>
                    ),
                    SNACKBAR_OPTIONS,
                  )
                }
              >
                비교하기
              </Button>
            </div>
          </div>

          {isDealActive && (
            <Link
              href="/deals"
              className="flex items-center gap-2 rounded-xl bg-surface-info-weak p-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="flex-1 text-body-medium-14 text-text-body-info-strong">
                타임딜 종료까지{" "}
                <Countdown
                  compact
                  endsAt={DEAL_ENDS_AT}
                  onEnd={() => setDealOver(true)}
                  className="text-body-medium-14 text-text-body-info-strong"
                />{" "}
                남음
              </span>
              <Icon name="right" className="size-6 text-text-body-info-strong" />
            </Link>
          )}

          {/* 시안(1702-18721)은 표 맨 위에 선이 없다. 마지막 줄만 선이 없는 것과 반대다 */}
          <dl className="flex flex-col">
            {/* 기본 DefinitionRow(min-h-12·items-center)는 다른 화면의 48px 터치 행 기준이다.
                이 표는 시안(1716-34202)이 행 높이를 고정하지 않고 py-8(8px)만 주므로
                min-h를 지우고, 값이 두 줄이 될 때 항목명이 첫 줄에 맞춰지도록
                items-start로 정렬한다 */}
            <DefinitionRow
              term="배송"
              description={MOCK_PRODUCT.shipping}
              className="min-h-0 items-start border-b border-border px-0 [&>dd]:whitespace-normal"
              termClassName="w-22 text-label-medium-14 text-text-body-default"
              descriptionClassName="text-caption-regular-13 text-text-body-secondary"
            />
            <DefinitionRow
              term="배송비"
              description={MOCK_PRODUCT.shippingFee}
              className="min-h-0 items-start border-b border-border px-0 [&>dd]:whitespace-normal"
              termClassName="w-22 text-label-medium-14 text-text-body-default"
              descriptionClassName="text-caption-regular-13 text-text-body-secondary"
            />
            <DefinitionRow
              term="판매자"
              description={MOCK_PRODUCT.seller}
              className="min-h-0 items-start px-0"
              termClassName="w-22 text-label-medium-14 text-text-body-default"
              descriptionClassName="text-caption-regular-13 text-text-body-secondary"
            />
          </dl>
        </section>

        <div className="h-2 bg-muted" />

        {match && pets ? (
          <>
            <MatchPanel pets={pets} onPetChange={setPetId} match={match} />
            <div className="h-2 bg-muted" />
          </>
        ) : isWaitingMatch ? (
          <>
            <div
              role="status"
              aria-label="적합도를 불러오는 중"
              className="flex flex-col gap-3 p-5"
            >
              <Skeleton className="h-8 w-44 rounded-full" />
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="h-2 bg-muted" />
          </>
        ) : (
          matchFailed && (
            <>
              <div role="alert" className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                <p className="text-body-regular-14 text-text-body-secondary">
                  적합도를 불러오지 못했어요. 다시 시도해 주세요.
                </p>
                <Button
                  variant="outline"
                  className="min-h-11 px-4"
                  disabled={petList.isRetrying || petDetail.isRetrying}
                  onClick={retryMatch}
                >
                  <LoadingSwap
                    loading={petList.isRetrying || petDetail.isRetrying}
                    label="적합도를 다시 불러오는 중"
                  >
                    다시 시도
                  </LoadingSwap>
                </Button>
              </div>
              <div className="h-2 bg-muted" />
            </>
          )
        )}

        {/* 볼 것이 없거나 받지 못하면 칸과 아래 구분선을 함께 그리지 않는다. 상품을 보는 데
            방해되지 않게 이 칸만 기다리고 이 칸만 실패한다 */}
        <ErrorBoundary fallback={() => null} resetKeys={[relatedPromise]}>
          <Suspense fallback={<RelatedProductsSkeleton />}>
            <RelatedProducts productsPromise={relatedPromise} />
          </Suspense>
        </ErrorBoundary>

        <Tabs
          value={tab}
          onValueChange={(next) => void setTab(next as (typeof TABS)[number])}
          className="gap-0 pt-4"
        >
          {/* 시안(x=24)이 본문 여백(20px)보다 살짝 더 넓다 — 시안 그대로 24px을 쓰되
              배경색 상자 자체를 감싸야 한다. TabsList에 padding을 주면 안쪽 글자만
              밀리고 회색 배경은 그대로 화면 끝까지 붙는다 */}
          <div className="px-6">
            <TabsList variant="segment" className="w-full [&>*]:flex-1">
              {TAB_LABEL.map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="text-label-bold-16">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="info">
            <ProductInfoPanel
              detail={product.detail}
              productName={product.name}
              match={match ?? EXAMPLE_MATCH_WITHOUT_PET}
              petName={match?.petName}
            />
          </TabsContent>

          <TabsContent value="review">
            {/* 별점 요약도 리뷰 목록 응답(`averageRating`·`totalCount`)에서 받는다.
                상품 응답의 값과 출처를 나누면 탭 안팎이 어긋날 수 있어 한쪽으로 모은다 */}
            <ReviewPanel productId={productId} />
          </TabsContent>

          <TabsContent value="qna">
            <QnaPanel inquiries={MOCK_INQUIRIES} />
          </TabsContent>
        </Tabs>

        {/* 시안(1758-54796)은 본문 맨 끝에 20px 회색 여백을 두어 하단 고정 메뉴와
            구분한다. 다른 곳의 8px 구분선(h-2 bg-muted)과 같은 색, 높이만 다르다 */}
        <div className="h-5 bg-muted" />
      </main>

      {/* 시안(1702-19198 등)의 하단 버튼 글자는 14px 굵게다. BottomActionBar 기본값(16px,
          다른 화면 button/xl 기준)은 그대로 두고 이 화면만 덮어쓴다 */}
      <BottomActionBar className="[&>*]:text-label-bold-14">
        {isDealActive ? (
          // 시안(1702-18950)은 타임딜 중엔 찜 대신 장바구니 아이콘으로 바뀐다
          <Link
            href="/cart"
            aria-label="장바구니"
            className="flex size-11 flex-none! items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon name="cart" aria-hidden className="size-6 text-icon-stroke-tertiary" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={liked ? "찜 목록에서 빼기" : "찜 목록에 담기"}
            aria-pressed={liked}
            // 찜 여부를 받는 동안은 누를 수 없다 — PATCH가 토글이라 모르는 채로 누르면 서버의 찜이 지워진다(#493 리뷰). 받은 뒤에는 낙관적 갱신이라 누르는 즉시 바뀐다
            disabled={wishStatus.isLoading}
            onClick={toggleLike}
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
        )}
        {isDealActive ? (
          // 타임딜 중에는 장바구니·바로 구매 두 버튼 대신 카운트다운이 붙은 구매 버튼 하나다
          <Button asChild className="min-h-11 gap-1.5">
            <Link href="/payment">
              <Countdown
                compact
                endsAt={DEAL_ENDS_AT}
                onEnd={() => setDealOver(true)}
                className="rounded bg-surface-info px-1 py-0.5 text-label-bold-12 text-text-body-static-white"
              />
              타임딜 구매하기
            </Link>
          </Button>
        ) : isSoldOut ? (
          // 살 수 없으니 장바구니·바로 구매 대신 재입고 알림만 남는다. 시안(1702-19653)은
          // 눌러도 버튼이 그대로고 스낵바로만 알린다 — 장바구니 담기와 같은 방식이다
          <Button
            className="min-h-11"
            onClick={() => showSnackbar("재입고되면 바로 알려드릴게요!")}
          >
            재입고 알림 신청
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => setOptionSheetOpen(true)}
            >
              장바구니
            </Button>
            <Button asChild className="min-h-11">
              <Link href="/payment">바로 구매</Link>
            </Button>
          </>
        )}
      </BottomActionBar>

      <DetailOptionSheet
        open={optionSheetOpen}
        onOpenChange={setOptionSheetOpen}
        adding={isAdding}
        onAddToCart={async (quantity) => {
          // **타임딜 중인 상품은 담는 식별자가 다르다.** 딜 아이템으로 담아야 딜가가
          // 적용된다 — 그냥 상품으로 담으면 정가로 들어간다 (views/deals와 같은 방식)
          await add(cartItemRef, quantity);
          setOptionSheetOpen(false);
          showSnackbar("상품이 장바구니에 담겼어요");
        }}
        productName={product.name}
        quantityLabel={netQuantityLabel}
        price={product.price}
      />

      <ScrollTopButton />
    </div>
  );
}
