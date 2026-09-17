// 메인 화면. 전체 탭은 골라주는 화면이고, 종류 탭은 상품 목록이다.
// UI 시안 기준(홈화면 1758-68883, 사료 탭 1758-69075 등)이다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useRef, useState } from "react";

import { PetSwitcher, ProductFeedbackSheet, type FeedbackTarget } from "@/entities/pet";
import { MatchScoreBadge } from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { BottomNav } from "@/widgets/bottom-nav";

const CATEGORIES = ["all", "food", "snack", "supplement"] as const;
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  all: "전체",
  food: "사료",
  snack: "간식",
  supplement: "영양제",
};

type Sort = { value: string; label: string };

/** 시안 메인_사료 탭_드롭다운의 정렬 목록. 추천순이 기본이다 */
const SORTS: Sort[] = [
  { value: "recommend", label: "추천순" },
  { value: "latest", label: "최신순" },
  { value: "rating-high", label: "별점 높은순" },
  { value: "rating-low", label: "별점 낮은순" },
];
const SORT_VALUES = ["recommend", "latest", "rating-high", "rating-low"] as const;

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PETS = [
  { id: "1", name: "소리" },
  { id: "2", name: "냥이" },
];

const MOCK_PRODUCTS = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  name: index % 2 === 0 ? "그레인프리 연어 사료 2kg" : "저자극 덴탈껌 14개입",
  price: index % 2 === 0 ? 31200 : 10800,
  originalPrice: index % 2 === 0 ? 38000 : 13100,
  dailyCost: index % 2 === 0 ? 1050 : 771,
  dailyLabel: index % 2 === 0 ? "하루 예상 급여비" : "1개당",
  rating: index % 2 === 0 ? 4.8 : 4.9,
  reviewCount: index % 2 === 0 ? 108 : 203,
  matchScore: 92 - index * 6,
  // API 연동 전까지 최신순 정렬 확인용. 실제로는 서버가 등록일을 준다
  createdAt: new Date(Date.now() - index * 86_400_000),
}));

/** 정렬 드롭다운 값에 맞춰 상품을 다시 늘어놓는다. 추천순은 적합도(matchScore) 기준이다 */
function sortProducts(products: typeof MOCK_PRODUCTS, sort: (typeof SORT_VALUES)[number]) {
  const sorted = [...products];
  switch (sort) {
    case "latest":
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "rating-high":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "rating-low":
      return sorted.sort((a, b) => a.rating - b.rating);
    case "recommend":
    default:
      return sorted.sort((a, b) => b.matchScore - a.matchScore);
  }
}

const MOCK_RECENT: FeedbackTarget[] = [
  {
    productId: "1",
    productName: "저자극 덴탈껌 14개입",
    sinceLabel: "구매 후 6일",
    countLabel: "3번째 구매",
  },
  {
    productId: "2",
    productName: "그레인프리 연어 사료 2kg",
    sinceLabel: "구매 후 12일",
    countLabel: "2번째 구매",
  },
];

/** 타임딜 종료 시각. 실제로는 서버가 준다 */
const DEAL_ENDS_AT = new Date(Date.now() + 11 * 3600_000 + 28 * 60_000 + 43_000);

/** 시안 ProductCard/Grid의 price 슬롯 — 하루 급여비 캡션 + 별점 + 후기 수를 한 자리에.
 * Rating Container는 5개 별을 늘어놓는 Rating(mypa_041_작성한 기준)과 달리 별 1개 + 숫자다 */
function ProductMeta({ product }: { product: (typeof MOCK_PRODUCTS)[number] }) {
  return (
    <>
      <p className="text-label-medium-11 text-text-body-tertiary">
        {product.dailyLabel} 약 {product.dailyCost.toLocaleString("ko-KR")}원
      </p>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-0.5">
          <span className="sr-only">5점 만점에 {product.rating}점</span>
          <Icon name="star" className="size-4 text-icon-fill-accent" />
          <span aria-hidden className="text-label-medium-14 text-text-body-tertiary">
            {product.rating.toFixed(1)}
          </span>
        </span>
        <span className="text-label-medium-14 text-text-body-tertiary">
          후기 {product.reviewCount}
        </span>
      </div>
    </>
  );
}

function SectionTitle({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="text-title-bold-20 text-foreground">{children}</h2>
      {href && (
        // 보이는 크기는 시안대로 두고, 누르는 자리만 after:로 44px 확보한다.
        // min-h-11을 쓰면 이 줄 전체가 44px로 늘어나 제목과 격자 사이 간격이 밀린다
        <Link
          href={href}
          className="relative text-label-medium-14 text-text-body-tertiary after:absolute after:-inset-2.75"
        >
          더보기
        </Link>
      )}
    </div>
  );
}

export function HomeView() {
  const router = useRouter();
  const [category, setCategory] = useQueryState(
    "category",
    // 전체 탭은 큐레이션, 종류 탭은 상품 목록으로 구성이 통째로 다르다.
    // 같은 목록의 필터가 아니므로 뒤로가기로 되돌아올 수 있어야 한다
    parseAsStringLiteral(CATEGORIES).withDefault("all").withOptions({ history: "push" }),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_VALUES).withDefault("recommend"),
  );
  const [petId, setPetId] = useState(MOCK_PETS[0].id);
  const [feedback, setFeedback] = useState<FeedbackTarget | null>(null);
  const [dealOver, setDealOver] = useState(false);
  const [notified, setNotified] = useState(false);
  const [recentIndex, setRecentIndex] = useState(0);
  const recentListRef = useRef<HTMLUListElement>(null);

  // 시안(Frame 31)의 점 표시기를 실제 스크롤 위치에 맞춘다. 카드 사이 간격(gap)까지
  // 포함해야 해서, 고정 폭을 그대로 쓰지 않고 옆 칸까지의 실제 간격(offsetLeft 차이)으로
  // 한 칸 크기를 구한다
  const handleRecentScroll = () => {
    const list = recentListRef.current;
    const first = list?.children[0] as HTMLElement | undefined;
    const second = list?.children[1] as HTMLElement | undefined;
    if (!list || !first || !second) return;
    const step = second.offsetLeft - first.offsetLeft;
    if (step <= 0) return;
    const index = Math.round(list.scrollLeft / step);
    setRecentIndex(Math.max(0, Math.min(MOCK_RECENT.length - 1, index)));
  };

  const pet = MOCK_PETS.find((item) => item.id === petId) ?? MOCK_PETS[0];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안 header/type=logo. 실제 로고 이미지 자산이 아직 없어 글자를 그대로 둔다 */}
      <header className="flex h-12 items-center justify-between px-5">
        <p className="text-title-bold-18 text-brand">골라주개냥</p>
        <nav
          aria-label="바로 가기"
          className="flex items-center gap-2.25 text-icon-stroke-tertiary"
        >
          {/* 보이는 자리는 시안대로 28px·9px 간격을 두고, 누르는 자리만 after로 안 보이게 넓힌다.
              가로는 간격(9px)의 절반까지만 넓혀 옆 아이콘 터치 영역과 겹치지 않게 한다 */}
          <Link
            href="/search"
            aria-label="검색"
            className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
          >
            <Icon name="search" className="size-7" />
          </Link>
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
        </nav>
      </header>

      {/* 탭처럼 보이지만 탭 역할을 주지 않는다. 고르면 화면 구성이 통째로 바뀌고 주소도 달라져
          연결할 패널이 없다. 지금 어느 것을 보고 있는지는 aria-current로 알린다.
          시안 tap_item: 활성은 label-bold-14 + 검정 밑줄, 비활성은 label-medium-14 + 회색 */}
      <nav aria-label="상품 종류" className="flex px-5">
        {CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            aria-current={category === value ? "page" : undefined}
            onClick={() => void setCategory(value)}
            className={
              category === value
                ? "min-h-11 border-b border-border-strong px-2 text-label-bold-14 text-text-label-default"
                : "min-h-11 border-b border-transparent px-2 text-label-medium-14 text-text-body-tertiary"
            }
          >
            {CATEGORY_LABEL[value]}
          </button>
        ))}
      </nav>

      <main className="flex flex-1 flex-col pb-24">
        {category === "all" ? (
          <>
            {/* 프로모션 배너. 시안은 문구 없이 사진 배너 하나다 — 홍보 문구는 이미지 안에 들어간다 */}
            <section aria-label="진행 중인 행사" className="relative p-5">
              <div className="aspect-4/3 overflow-hidden rounded-lg bg-muted" />
              {/* 배너가 여럿임을 알리는 자리. 넘기는 것은 서버 데이터가 붙은 뒤에 잇는다.
                  시안(Frame 31)은 사진 박스가 아니라 padding을 포함한 이 섹션 기준
                  bottom-[29.75px]다 — 테두리 없이 짙은 원 1개 + 옅은 원 2개.
                  비선택 원은 라이트/다크 각각 surface/default(흰색/#141414)라 고정
                  흰색이 아니라 모드에 따라 바뀌는 토큰(bg-background)을 쓴다 */}
              <span
                aria-hidden
                className="absolute bottom-[29.75px] left-1/2 flex -translate-x-1/2 gap-1"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="size-1.5 rounded-full bg-background" />
                <span className="size-1.5 rounded-full bg-background" />
              </span>
            </section>

            <PetSwitcher
              pets={MOCK_PETS}
              selectedId={petId}
              onSelect={setPetId}
              // #189가 정한 대로 새 아이는 온보딩 기본 정보 단계로 잇는다
              onAdd={() => router.push("/onboarding?step=basic")}
              withNames
              variant="main"
            />

            <section className="flex flex-col gap-5 pt-6 pb-8 pl-5">
              <SectionTitle href="/recommendations" className="pr-5">
                AI가 골라주는 {pet.name} 맞춤 상품
              </SectionTitle>
              <ScrollRow
                label={`${pet.name} 맞춤 상품`}
                itemWidth="208px"
                edgeInset={5}
                bleedRight={false}
              >
                {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                  <ScrollRowItem key={product.id}>
                    <ProductGridCard
                      href={`/products/${product.id}`}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      imageBadge={<MatchScoreBadge score={product.matchScore} petName={pet.name} />}
                      imageAction={
                        // 시안(Reaction Button)은 24px 흰색이다 — 사진 위에 얹히므로 흰색이어야 보인다
                        <span
                          aria-hidden
                          className="flex size-6 items-center justify-center text-icon-fill-static-white"
                        >
                          <Icon name="heart_stroke" className="size-6" />
                        </span>
                      }
                      meta={<ProductMeta product={product} />}
                    />
                  </ScrollRowItem>
                ))}
              </ScrollRow>
            </section>

            {/* 이 서비스가 근거를 모으는 자리 */}
            <section className="flex flex-col gap-3 py-6 pl-5">
              <SectionTitle className="pr-5">최근에 구매한 상품, 아이는 어때요?</SectionTitle>
              <ScrollRow
                ref={recentListRef}
                onScroll={handleRecentScroll}
                label="최근에 구매한 상품"
                itemWidth="322px"
                edgeInset={5}
                bleedRight={false}
                className="gap-2"
              >
                {MOCK_RECENT.map((item) => (
                  <ScrollRowItem key={item.productId}>
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="size-15 shrink-0 rounded-lg bg-muted" />
                        <div className="flex min-w-0 flex-col gap-2">
                          {/* 시안은 15px SemiBold(raw, 토큰 없음)인데 이 크기의 타입 토큰이
                              디자인 시스템에 없다. SemiBold(600)도 #162에서 정리된 대로 이
                              프로젝트가 등록해 쓰지 않는 굵기라, 가장 가까운 기존 토큰
                              (14px Bold)으로 근사한다 — PD팀에 15px·SemiBold 처리 여부 확인 필요 */}
                          <p className="truncate text-label-bold-14 text-foreground">
                            {item.productName}
                          </p>
                          <p className="flex gap-2">
                            <Badge>{item.sinceLabel}</Badge>
                            <Badge variant="outline">{item.countLabel}</Badge>
                          </p>
                        </div>
                      </div>
                      <Button
                        className="min-h-11 w-full bg-brand text-label-bold-16 font-bold text-brand-foreground hover:bg-brand/90"
                        onClick={() => setFeedback(item)}
                      >
                        우리 아이 반응 남기기
                      </Button>
                    </div>
                  </ScrollRowItem>
                ))}
              </ScrollRow>
              {/* 시안(Frame 31)은 배너와 같은 점 표시기다 — 이 목록은 있고, 아래 두 목록
                  (AI 추천·타임딜)은 개수가 안 정해져 있어 없다. 피그마엔 점이 3개
                  보이지만, 코드는 목데이터 개수만큼 그리므로 지금은 MOCK_RECENT가
                  2개라 2개만 뜬다 */}
              <span aria-hidden className="flex justify-center gap-1">
                {MOCK_RECENT.map((item, index) => (
                  <span
                    key={item.productId}
                    className={cn(
                      "size-1.5 rounded-full",
                      index === recentIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                ))}
              </span>
            </section>

            {/* 시안은 이 줄만 왼쪽 여백(pl-5)이고 오른쪽은 없다 — ScrollRow가 화면
                끝까지 삐져나가야 해서, 그 줄 말고 나머지 자식들에 pr-5를 따로 준다 */}
            <section className="flex flex-col gap-6 pt-5 pb-8 pl-5">
              <div className="flex flex-col gap-1 pr-5">
                <h2 className="text-title-bold-20 text-foreground">
                  {dealOver ? (
                    "오늘의 타임딜"
                  ) : (
                    <>
                      매주 목요일 밤 12시 <span className="text-brand">타임딜 특가</span>
                    </>
                  )}
                </h2>

                {!dealOver && (
                  <div className="flex flex-col gap-0.5">
                    <Countdown endsAt={DEAL_ENDS_AT} onEnd={() => setDealOver(true)} />
                    <p className="text-body-regular-14 text-text-body-secondary">
                      종료까지 남은 시간
                    </p>
                  </div>
                )}
              </div>

              {dealOver ? (
                <div className="pr-5">
                  <EmptyState
                    icon={<Icon name="clock" />}
                    title="지금은 진행 중인 타임딜이 없어요"
                    description="매주 목요일 밤 12시에 새로운 특가가 열려요"
                    className="rounded-xl border border-dashed border-border px-0 py-4"
                    action={
                      // 알림 신청 API가 아직 없어 타임딜 화면(DealsView)처럼 로컬 상태로만 완료를 알린다
                      notified ? (
                        <p
                          role="status"
                          className="inline-flex min-h-11 items-center gap-1 px-2.5 text-body-medium-14 text-text-body-secondary"
                        >
                          <Icon name="check" className="size-5" />
                          오픈 알림 신청됨
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNotified(true)}
                          className="flex min-h-11 items-center gap-1 px-2.5 text-body-medium-14 text-brand"
                        >
                          <Icon name="bell" className="size-5" />
                          오픈 알림 받기
                        </button>
                      )
                    }
                  />
                </div>
              ) : (
                <>
                  <ScrollRow label="타임딜 상품" itemWidth="160px" edgeInset={5} bleedRight={false}>
                    {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                      <ScrollRowItem key={product.id}>
                        <ProductGridCard
                          href={`/products/${product.id}`}
                          name={product.name}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          imageBadge={
                            <MatchScoreBadge score={product.matchScore} petName={pet.name} />
                          }
                          imageAction={
                            // 시안(Reaction Button)은 24px 흰색이다 — 사진 위에 얹히므로 흰색이어야 보인다
                            <span
                              aria-hidden
                              className="flex size-6 items-center justify-center text-icon-fill-static-white"
                            >
                              <Icon name="heart_stroke" className="size-6" />
                            </span>
                          }
                          meta={<ProductMeta product={product} />}
                        />
                      </ScrollRowItem>
                    ))}
                  </ScrollRow>

                  <div className="pr-5">
                    <Button
                      variant="outline"
                      className="min-h-11 w-full text-label-bold-16 font-bold"
                      asChild
                    >
                      <Link href="/deals">특가 더보기</Link>
                    </Button>
                  </div>
                </>
              )}

              {/* 화면 확인용. 서버가 주는 값으로 바뀐다 */}
              <button
                type="button"
                onClick={() => setDealOver((prev) => !prev)}
                className="min-h-11 pr-5 text-xs text-muted-foreground underline underline-offset-4"
              >
                {dealOver ? "타임딜 있는 화면 보기" : "타임딜 없는 화면 보기"}
              </button>
            </section>
          </>
        ) : (
          <div className="flex flex-1 flex-col">
            {/* 시안은 이 줄과 격자 사이에 별도 간격이 없다 — 이 줄 자체의 p-5(20px)가
                탭 바·격자 양쪽과의 여백을 만든다 */}
            <div className="flex justify-end p-5">
              <Select
                value={sort}
                onValueChange={(next) => void setSort(next as (typeof SORT_VALUES)[number])}
              >
                <SelectTrigger
                  aria-label="정렬"
                  // 보이는 크기는 시안대로 두고, 누르는 자리만 after:로 시안 프레임
                  // 높이(59px)만큼 확보한다. 글자 자체는 22px(line-height)라 위아래로
                  // (59-22)/2=18.5px씩 남긴다
                  className="relative w-auto border-0 bg-transparent p-0 text-label-bold-14 shadow-none after:absolute after:inset-[-18.5px] data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent"
                >
                  <SelectValue />
                </SelectTrigger>
                {/* 시안(dropdown)은 테두리 안쪽에 4px 여백을 두고 그 안에 항목을 채운다.
                    트리거 아래로 열리는 일반 드롭다운이라 position="popper"·오른쪽 정렬을 쓴다 */}
                <SelectContent position="popper" align="end" className="w-42.5 min-w-42.5 p-1">
                  {SORTS.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      // 시안은 고른 항목을 체크 표시가 아니라 배경색으로만 구분한다.
                      // Select 기본은 체크 아이콘을 같이 보여줘서 숨긴다
                      className="h-10 rounded-md px-1.5 text-label-medium-14 data-[state=checked]:bg-surface-weak data-[state=checked]:font-bold [&>span:first-child]:hidden"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 px-5">
              {sortProducts(MOCK_PRODUCTS, sort).map((product) => (
                <li key={product.id} className="flex">
                  <ProductGridCard
                    className="flex-1"
                    href={`/products/${product.id}`}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    imageBadge={<MatchScoreBadge score={product.matchScore} petName={pet.name} />}
                    meta={<ProductMeta product={product} />}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <BottomNav />

      <ProductFeedbackSheet
        target={feedback}
        petName={pet.name}
        onOpenChange={(open) => !open && setFeedback(null)}
        onSeeProduct={(productId) => router.push(`/products/${productId}`)}
        variant="full"
      />
    </div>
  );
}
