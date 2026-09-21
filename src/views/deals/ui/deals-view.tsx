// 타임딜 화면. 진행 중인 딜과 오픈 예정인 딜을 탭으로 나눈다.
// UI 시안 기준(#275, 진행중 1905-32375, 담긴 상태 1905-32403, 오픈예정 1905-32432,
// 빈 화면 1905-32457, 옵션 시트 2544-56035)이다.
//
// 이 화면의 주인공은 상품이 아니라 남은 시간이다. 시간이 다 되면 목록도 함께 사라진다.

"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { ProductOptionSheet, type OptionSheetProduct } from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { calcDiscountRate, formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["live", "upcoming"] as const;

const TAB_LABEL = [
  ["live", "진행중"],
  ["upcoming", "오픈 예정"],
] as const;

type LiveDeal = {
  /** 이 딜 자체의 id. `time_deal_items`의 `deal_item_id`에 대응할 자리 */
  id: string;
  /** 상품 상세로 이동할 때 쓰는 실제 상품 id. 딜 id와 다른 자원이다 */
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  optionLabel: string;
  unitLabel: string;
  unitAmount: number;
  /** 남은 수량 상태. 품절이면 담을 수 없다 */
  stock: "enough" | "low" | "none";
};

type UpcomingDeal = {
  id: string;
  name: string;
  /** 열릴 때 적용될 할인율 */
  expectedRate: number;
};

// 시안(1905-32420 등)의 예시 상품·가격을 그대로 옮겼다. 목록과 옵션 시트가 같은
// 값을 보게 하려고 한 군데(이 배열)만 둔다 — 시안 원본은 목록 24,000원과 시트
// 21,000원이 서로 달랐는데(같은 상품·같은 급여비 캡션인데도), 목록 값을 기준으로
// 삼았다. 어느 쪽이 맞는지는 PD팀 확인 중이다(개인 QA 기록)
const LIVE_DEALS: LiveDeal[] = [
  {
    id: "d1",
    productId: "p101",
    name: "오리&고구마 소형견 사료 1.5kg",
    price: 24_000,
    originalPrice: 32_000,
    optionLabel: "1.5kg (기본 구성)",
    unitLabel: "하루 예상 급여비 약",
    unitAmount: 960,
    stock: "low",
  },
  {
    id: "d2",
    productId: "p102",
    name: "데일리 루테인 영양제 30정",
    price: 14_400,
    originalPrice: 18_000,
    optionLabel: "30정 (기본 구성)",
    unitLabel: "1정당 약",
    unitAmount: 480,
    stock: "enough",
  },
  {
    id: "d3",
    productId: "p103",
    name: "황태 단호박 미니 큐브 20개입",
    price: 13_600,
    originalPrice: 16_000,
    optionLabel: "20개입 (기본 구성)",
    unitLabel: "1개당 약",
    unitAmount: 680,
    stock: "none",
  },
];

const UPCOMING_DEALS: UpcomingDeal[] = [
  { id: "u1", name: "사슴고기&현미 소형견 사료 1.2kg", expectedRate: 22 },
  { id: "u2", name: "고양이 그레인프리 사료 1.5kg", expectedRate: 30 },
];

/** 내일 오전 10시. 실제로는 서버가 오픈 시각을 준다.
 * 오늘 10시가 아직 안 지났으면 오늘로 잡는 대신 늘 내일로 고정한다 — 접속 시각에 따라
 * "오늘"·"내일"이 오락가락하면 화면을 확인할 때마다 문구가 달라져 QA하기 어렵다 */
function nextOpenAt() {
  const at = new Date();
  at.setDate(at.getDate() + 1);
  at.setHours(10, 0, 0, 0);
  return at;
}

/** "내일 오전 10시". 오늘·내일이면 날짜 대신 그 말을 쓴다 */
function formatOpenAt(at: Date) {
  const day = isToday(at)
    ? "오늘"
    : isTomorrow(at)
      ? "내일"
      : format(at, "M월 d일", { locale: ko });
  return `${day} ${format(at, "a h'시'", { locale: ko })}`;
}

// 시안(1905-32420·32424·32428)의 배지 색·문구다. 재고 충분(enough)은 배지가 없다
const STOCK_BADGE = {
  low: { label: "품절임박", className: "bg-brand text-brand-foreground" },
  none: { label: "품절", className: "bg-primary text-primary-foreground" },
} as const;

export function DealsView() {
  // nuqs 기본은 replace라 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다.
  // 고른 탭에 따라 보이는 것이 통째로 달라지므로 되돌아올 수 있어야 한다
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("live").withOptions({ history: "push" }),
  );

  // 목 데이터 단계라 화면에 붙는 순간을 기준으로 잡는다. 실제로는 서버가 종료 시각을 준다
  const [endsAt] = useState(() => new Date(Date.now() + 11 * 3_600_000 + 28 * 60_000 + 43_000));
  const [opensAt] = useState(nextOpenAt);

  const [dealOver, setDealOver] = useState(false);
  const [picked, setPicked] = useState<OptionSheetProduct | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [notified, setNotified] = useState(false);

  const openLabel = formatOpenAt(opensAt);

  const addToCart = (productId: string) => {
    setAddedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    setPicked(null);
    // 시안(1905-32431 snackbar)은 수량 설명 없이 한 줄이다
    showSnackbar("장바구니에 담겼어요");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="타임딜"
        right={
          // 시안(1905-32416)의 공용 header 아이콘 방식이다(product-detail·product-compare와 동일).
          // 장바구니 개수 배지는 실제 연동 전까지 생략한다(로컬 QA 기록)
          <>
            <Link
              href="/search"
              aria-label="검색"
              className="relative flex size-7 items-center justify-center after:absolute after:-inset-2"
            >
              <Icon name="search" className="size-7" />
            </Link>
            <Link
              href="/cart"
              aria-label="장바구니"
              className="relative flex size-7 items-center justify-center after:absolute after:-inset-2"
            >
              <Icon name="cart" className="size-7" />
            </Link>
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(next) => void setTab(next as (typeof TABS)[number])}
        className="flex-1 gap-0"
      >
        {/* 시안(1905-32413)은 탭 줄 전체를 가르는 회색 선이 없다 — 고른 탭 글자 바로
            아래에만 1px 밑줄이 붙는다. 나머지는 배경과 같은 흰 바탕이다 */}
        <TabsList variant="line" className="h-10 w-full justify-start gap-0 px-5">
          {TAB_LABEL.map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="relative h-8 flex-none px-2 text-label-medium-14 text-text-body-tertiary before:absolute before:inset-x-0 before:-inset-y-1.5 after:bg-border-strong group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-px data-active:text-label-bold-14 data-active:text-foreground"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="live" className="flex flex-col">
          {dealOver ? (
            <EmptyState
              // 시안(1905-32457)은 44px 아이콘·icon/fill/secondary 색이다(다른 화면의
              // 72px·icon-fill-tertiary 기본값과 다르다). EmptyState가 아이콘을 담는
              // 자리에 `[&>svg]:size-18`을 걸어 두어 className 크기 지정으로는 못 이긴다
              // (부모>svg 결합자가 단일 클래스보다 우선) — 인라인 style로 덮는다
              icon={
                <Icon
                  name="clock"
                  className="text-icon-fill-secondary"
                  style={{ width: 44, height: 44 }}
                />
              }
              title="지금 진행 중인 타임딜이 없어요"
              // 시안은 title/bold_18이 아니라 body/medium_18(18px·500)이다
              titleClassName="text-body-medium-18"
              description={
                <>
                  새로운 타임딜이 열리면 알려드릴게요
                  <br />
                  다른 상품도 둘러보시겠어요?
                </>
              }
              // 시안엔 버튼이 없다. 우선 시안 그대로 두고, 버튼이 있는 편이 나을지는
              // PD팀 확인 중이다(개인 QA 기록) — 답에 따라 되살릴 수 있다
              className="flex-1"
            />
          ) : (
            <>
              <div className="flex flex-col px-5 pt-3">
                <Countdown endsAt={endsAt} onEnd={() => setDealOver(true)} />
                <p className="text-sm text-muted-foreground">종료까지 남은 시간</p>
              </div>

              <ul className="flex flex-col">
                {LIVE_DEALS.map((deal) => {
                  const soldOut = deal.stock === "none";
                  const added = addedIds.includes(deal.id);
                  const badge = deal.stock === "enough" ? null : STOCK_BADGE[deal.stock];
                  const discountRate = calcDiscountRate(deal.price, deal.originalPrice);

                  return (
                    <li
                      key={deal.id}
                      className={cn(
                        "relative border-b border-border last:border-b-0",
                        // 시안(1905-32428)은 품절 카드 전체를 45%로 흐리게 한다
                        soldOut && "opacity-45",
                      )}
                    >
                      {/* 썸네일·텍스트를 누르면 상품 상세로 간다. 담기 버튼은 링크 안에
                          두면 "링크 속 버튼"이 되어 눌리지 않으므로 링크 바깥의 절대
                          위치 요소로 따로 둔다(product-grid-card의 imageAction과 같은 방식) */}
                      <Link
                        href={`/products/${deal.productId}`}
                        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <ProductSummary
                          name={deal.name}
                          imageSize={24}
                          className="gap-4 py-5 pr-17 pl-5"
                          imageBadge={
                            badge && (
                              <span
                                className={cn(
                                  "rounded px-1 py-0.5 text-label-medium-12",
                                  badge.className,
                                )}
                              >
                                {badge.label}
                              </span>
                            )
                          }
                          meta={
                            <div className="flex flex-col items-start">
                              {discountRate > 0 && (
                                <p className="text-label-regular-13 text-text-body-unselect line-through">
                                  {formatWon(deal.originalPrice)}
                                </p>
                              )}
                              <div className="flex items-center gap-1">
                                {discountRate > 0 && (
                                  <span className="text-label-regular-13 font-bold text-destructive">
                                    {discountRate}%
                                  </span>
                                )}
                                <span className="text-title-bold-18 text-foreground">
                                  {formatWon(deal.price)}
                                </span>
                              </div>
                              <p className="text-label-medium-11 text-text-body-unselect">
                                {deal.unitLabel} {formatWon(deal.unitAmount)}
                              </p>
                            </div>
                          }
                        />
                      </Link>
                      <button
                        type="button"
                        disabled={soldOut}
                        aria-label={
                          soldOut
                            ? `${deal.name} 품절`
                            : added
                              ? `${deal.name} 장바구니에서 빼기`
                              : `${deal.name} 장바구니에 담기`
                        }
                        onClick={() =>
                          added
                            ? setAddedIds((prev) => prev.filter((id) => id !== deal.id))
                            : setPicked({
                                id: deal.id,
                                name: deal.name,
                                price: deal.price,
                                optionLabel: deal.optionLabel,
                                unitLabel: deal.unitLabel,
                                unitAmount: deal.unitAmount,
                              })
                        }
                        // 시안(1905-32420·32424·32428)은 테두리 없는 6px 모서리
                        // 사각형이다. 담을 수 있음/담김은 배경이 아예 없고, 품절만
                        // disable 회색(surface-disable)이 채워진다. 링크 위에 겹쳐야 해서
                        // absolute로 뺐다(product-grid-card의 imageAction과 같은 방식)
                        className={cn(
                          "absolute top-1/2 right-5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors",
                          "after:absolute after:-inset-1.5",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          soldOut ? "bg-surface-disable" : "hover:bg-muted",
                        )}
                      >
                        {added ? (
                          <Icon
                            name="check"
                            aria-hidden
                            className="size-6 text-icon-fill-default"
                          />
                        ) : (
                          <Icon
                            name="cart"
                            aria-hidden
                            className="size-6 text-icon-fill-secondary"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="flex flex-col">
          <div className="flex flex-col px-5 pt-3">
            {/* 신청해도 나중에 취소할 수 있어 남은 시간은 계속 보여준다. 버튼 문구만 바뀐다 */}
            <Countdown
              endsAt={opensAt}
              fallback={<p className="text-2xl font-bold text-foreground">곧 열려요</p>}
            />
            <p className="text-sm text-muted-foreground">{openLabel}에 봬요!</p>
          </div>

          <ul className="flex flex-col">
            {UPCOMING_DEALS.map((deal) => (
              <li key={deal.id} className="border-b border-border last:border-b-0">
                <ProductSummary
                  name={deal.name}
                  imageSize={24}
                  className="gap-4 p-5"
                  meta={
                    <span className="flex flex-col gap-0.5">
                      <span className="text-title-bold-18 text-brand">
                        예정 {deal.expectedRate}%
                      </span>
                      <span className="text-label-medium-11 text-text-body-unselect">
                        {openLabel} 오픈
                      </span>
                    </span>
                  }
                  // 시안(1905-32448)은 이 자리(action_button)가 아예 없다 — 장식용
                  // 가방 아이콘을 지운다
                />
              </li>
            ))}
          </ul>

          <div className="px-5 py-4">
            {/* 다시 누르면 신청을 취소한다. 이 "신청됨" 상태 자체의 시안은 아직 개별
                확인 전이다(로컬 QA 기록) */}
            {notified ? (
              // 신청 전 버튼과 높이·모서리·글자 스타일·눌림 효과가 전부 같아야 해서
              // 직접 만든 button 대신 같은 공용 Button을 쓴다(variant만 바꾼다)
              <Button
                variant="default"
                onClick={() => setNotified(false)}
                aria-label="오픈 알림 신청 취소하기"
                className="min-h-11 text-label-bold-14"
              >
                <Icon name="bell" aria-hidden className="size-6" />
                오픈 알림 신청됨
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setNotified(true)}
                className="min-h-11 text-label-bold-14"
              >
                <Icon name="bell" aria-hidden className="size-6 text-icon-stroke-tertiary" />
                오픈 알림 신청하기
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 실제 진행 딜이 11시간 넘게 남아 빈 상태를 보려면 오래 기다려야 한다.
          QA가 두 상태를 바로 오가며 볼 수 있게 둔 개발용 버튼이다 — 시안엔 없고
          운영 빌드에는 나가지 않는다 */}
      {process.env.NODE_ENV !== "production" && (
        <div className="border-t border-border p-4 text-center">
          <button
            type="button"
            onClick={() => setDealOver((prev) => !prev)}
            className="text-label-medium-12 text-text-body-tertiary underline"
          >
            [개발용] {dealOver ? "타임딜 상품 있는 상태 보기" : "타임딜 빈 상태 보기"}
          </button>
        </div>
      )}

      <ProductOptionSheet
        product={picked}
        onOpenChange={(open) => !open && setPicked(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}
