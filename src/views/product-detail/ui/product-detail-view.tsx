// 상품 상세 화면.
// 와이어프레임 기준(상품상세)이며 섹션 라벨이 아직 `수정 진행 예정`이라 바뀔 수 있다.
//
// 위에서부터 상품 자체 → 우리 아이에게 맞는지 → 함께 볼 것 → 자세한 정보 순으로 놓인다.
// 적합도를 가격 바로 아래 두는 것이 이 화면의 뜻이다. 스펙을 다 읽고 나서야
// 판단하게 하지 않고, 살지 말지를 정하는 자리에서 근거를 먼저 보인다.
//
// 적합도·영양 분석은 서버가 계산해 내려줄 값이라 지금은 `model/mock-product`의 목이다(#123).

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { showSnackbar, SNACKBAR_CLASS, SNACKBAR_OPTIONS } from "@/shared/ui/snackbar/snackbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { MOCK_INQUIRIES } from "../model/mock-inquiries";
import {
  DEAL_ENDS_AT,
  MOCK_PETS,
  MOCK_PRODUCT,
  PET_MATCHES,
  RELATED_PRODUCTS,
} from "../model/mock-product";
import { DetailOptionSheet } from "./detail-option-sheet";
import { MatchPanel } from "./match-panel";
import { ProductInfoPanel } from "./product-info-panel";
import { QnaPanel } from "./qna-panel";
import { ReviewPanel } from "./review-panel";

const TABS = ["info", "review", "qna"] as const;

// QA용. 목 데이터라 상태를 바꾸려면 코드를 고쳐야 했다. `?status=`로 덮어써
// 일반/타임딜/품절을 새로고침 없이 확인한다. 값이 없으면 목의 상태를 그대로 쓴다
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
  rating: number;
  reviewCount: number;
  /** 있으면 "후기" 부분이 버튼이 된다(상품 제목 아래는 리뷰 탭으로 이동, 카드는 정보만 보여준다) */
  onReviewClick?: () => void;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-0.5">
        <Icon name="star" className="size-5 text-icon-fill-accent" />
        <span className="text-body-medium-14 text-text-body-secondary">{rating.toFixed(1)}</span>
      </span>
      <span aria-hidden className="h-4 w-px bg-border" />
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
};

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const router = useRouter();
  // 고른 탭에 따라 보이는 것이 통째로 달라진다. nuqs 기본은 replace라
  // 그대로 두면 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("info").withOptions({ history: "push" }),
  );

  const [petId, setPetId] = useState(MOCK_PETS[0].id);
  const [liked, setLiked] = useState(false);
  const [optionSheetOpen, setOptionSheetOpen] = useState(false);
  // 시안(타임딜 1702-18698, 품절 1702-19204·19653)을 보여주는 자리. 실제로는
  // 상품 상태와 타임딜 종료 시각을 서버가 준다(#123)
  const [dealOver, setDealOver] = useState(false);
  const [statusOverride] = useQueryState("status", parseAsStringLiteral(STATUS_OVERRIDES));
  const status = statusOverride ?? MOCK_PRODUCT.status;
  const isDealActive = status === "deal" && !dealOver;
  const isSoldOut = status === "soldout";

  // 이름도 여기서 함께 온다. 아이 목록에서 따로 찾으면 폴백이 걸렸을 때
  // 이름과 근거가 서로 다른 아이 것이 된다
  const match = PET_MATCHES.find((item) => item.petId === petId) ?? PET_MATCHES[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        right={
          // 시안(공용 header)이 알림·장바구니 두 아이콘을 함께 둔다. 홈 화면 헤더와
          // 같은 아이콘·터치 영역 방식이다(보이는 자리 28px, 안 보이는 자리만 넓힘)
          <>
            <Link
              href="/mypage/notifications"
              aria-label="알림"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="bell_noti" className="size-7" />
            </Link>
            <Link
              href="/cart"
              aria-label="장바구니에 5개"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="cart" className="size-7" />
              {/* 시안(header, 카트 아이콘의 Notification Badge)의 18px·11px 값 그대로 */}
              <span
                aria-hidden
                className="absolute -top-1 -right-2 flex size-4.5 items-center justify-center rounded-full bg-brand text-label-bold-11 text-brand-foreground"
              >
                5
              </span>
            </Link>
          </>
        }
      />

      <main className="flex flex-1 flex-col">
        {/* 이미지가 아직 없다. 몇 장인지만 알고 자리와 점을 잡아 둔다 */}
        <div className="relative flex aspect-square items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">상품 이미지</span>
          <span aria-hidden className="absolute bottom-4 flex gap-1.5">
            {Array.from({ length: MOCK_PRODUCT.imageCount }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-1.5 rounded-full",
                  index === 0 ? "bg-foreground" : "bg-muted-foreground/40",
                )}
              />
            ))}
          </span>
        </div>

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
                  {MOCK_PRODUCT.name}
                </h1>
                {/* 리뷰는 이 화면의 탭이다. 다른 화면으로 보내지 않고 탭만 바꾼다 */}
                <RatingSummary
                  rating={MOCK_PRODUCT.rating}
                  reviewCount={MOCK_PRODUCT.reviewCount}
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
                amount={MOCK_PRODUCT.price}
                originalAmount={MOCK_PRODUCT.originalPrice}
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

        <MatchPanel pets={MOCK_PETS} onPetChange={setPetId} match={match} />

        <div className="h-2 bg-muted" />

        <section aria-labelledby="related-heading" className="flex flex-col gap-3 p-5">
          <h2 id="related-heading" className="text-title-bold-20 text-text-body-default">
            함께 보면 좋은 상품
          </h2>
          <ScrollRow label="함께 보면 좋은 상품" itemWidth="45%">
            {RELATED_PRODUCTS.map((product) => (
              <ScrollRowItem key={product.id}>
                {/* 목데이터가 이 상품 하나뿐이라 어느 카드를 눌러도 같은 화면이
                    나온다. 링크를 살려 두면 화면이 거짓말을 하므로 상품별 데이터가
                    붙을 때까지 누를 수 없게 둔다 */}
                <ProductGridCard
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  priceClassName="text-title-bold-16"
                  // 시안(1716-34241)의 찜 자리는 다른 화면(top-3 right-3)과 달리
                  // 사진 오른쪽 아래(4px 인셋)다
                  imageActionClassName="top-auto right-1 bottom-1"
                  imageAction={
                    // 흰 원 배경 위에 찜 아이콘을 얹는다. 목데이터가 상품 하나뿐이라
                    // 실제 찜 상태를 못 매겨 장식으로만 둔다
                    <span
                      aria-hidden
                      className="flex size-8 items-center justify-center rounded-full bg-surface-overlay-static"
                    >
                      <Icon name="heart_stroke" className="size-6 text-icon-fill-secondary" />
                    </span>
                  }
                  meta={
                    <span className="flex flex-col gap-1">
                      <span className="text-caption-regular-12 text-text-body-tertiary">
                        {product.unitLabel} {product.unitAmount.toLocaleString("ko-KR")}원
                      </span>
                      <RatingSummary rating={product.rating} reviewCount={product.reviewCount} />
                    </span>
                  }
                />
              </ScrollRowItem>
            ))}
          </ScrollRow>
        </section>

        <div className="h-2 bg-muted" />

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
            <ProductInfoPanel match={match} petName={match.petName} />
          </TabsContent>

          <TabsContent value="review">
            <ReviewPanel
              productId={productId}
              rating={MOCK_PRODUCT.rating}
              reviewCount={MOCK_PRODUCT.reviewCount}
              petProfileLabel={match.profileLabel}
            />
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
        onAddToCart={() => {
          setOptionSheetOpen(false);
          showSnackbar("상품이 장바구니에 담겼어요");
        }}
        productName={MOCK_PRODUCT.name}
        optionLabel={MOCK_PRODUCT.optionLabel}
        price={MOCK_PRODUCT.price}
      />

      <ScrollTopButton />
    </div>
  );
}
