// 타임딜 화면. 진행 중인 딜과 오픈 예정인 딜을 탭으로 나눈다.
// 와이어프레임 기준(타임딜_진행중, 타임딜_옵션 선택 바텀시트, 장바구니 담은 직후,
// 타임딜_오픈예정_알림신청 전/후, 타임딜_진행중 비워짐)이라 디자인 확정 시 바뀔 수 있다.
//
// 이 화면의 주인공은 상품이 아니라 남은 시간이다. 시간이 다 되면 목록도 함께 사라진다.

"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import {
  IoBagHandleOutline,
  IoCheckmark,
  IoNotificationsOutline,
  IoSearchOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { toast } from "sonner";

import { ProductOptionSheet, type OptionSheetProduct } from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["live", "upcoming"] as const;

const TAB_LABEL = [
  ["live", "진행중"],
  ["upcoming", "오픈 예정"],
] as const;

type LiveDeal = {
  id: string;
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

const LIVE_DEALS: LiveDeal[] = [
  {
    id: "d1",
    name: "면역 지원 영양제 90정",
    price: 21_000,
    originalPrice: 30_000,
    optionLabel: "90정 (기본 구성)",
    unitLabel: "1일 섭취 기준 약",
    unitAmount: 700,
    stock: "low",
  },
  {
    id: "d2",
    name: "닭가슴살 저염 트릿 200g",
    price: 9_750,
    originalPrice: 12_500,
    optionLabel: "200g (기본 구성)",
    unitLabel: "1일 섭취 기준 약",
    unitAmount: 195,
    stock: "enough",
  },
  {
    id: "d3",
    name: "노령견 저지방 소화케어 사료 2kg",
    price: 21_000,
    originalPrice: 30_000,
    optionLabel: "2kg (기본 구성)",
    unitLabel: "1일 섭취 기준 약",
    unitAmount: 700,
    stock: "none",
  },
];

const UPCOMING_DEALS: UpcomingDeal[] = [
  { id: "u1", name: "중소형견 소포장 사료 1kg", expectedRate: 25 },
  { id: "u2", name: "고양이 그레인프리 사료 1.5kg", expectedRate: 30 },
];

/** 다음 오전 10시. 실제로는 서버가 오픈 시각을 준다 */
function nextOpenAt() {
  const at = new Date();
  at.setHours(10, 0, 0, 0);
  if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
  return at;
}

/** "내일 오전 10:00". 오늘·내일이면 날짜 대신 그 말을 쓴다 */
function formatOpenAt(at: Date) {
  const day = isToday(at)
    ? "오늘"
    : isTomorrow(at)
      ? "내일"
      : format(at, "M월 d일", { locale: ko });
  return `${day} ${format(at, "a h:mm", { locale: ko })}`;
}

const STOCK_BADGE = {
  low: { label: "품절임박", className: "bg-brand text-brand-foreground" },
  none: { label: "품절", className: "bg-muted-foreground/70 text-background" },
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

  const addToCart = (productId: string, quantity: number) => {
    setAddedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    setPicked(null);
    toast.success("장바구니에 담겼어요", { description: `${quantity}개` });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="타임딜"
        right={
          <div className="flex items-center">
            <Link
              href="/search"
              aria-label="검색"
              className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IoSearchOutline aria-hidden className="size-6" />
            </Link>
            <Link
              href="/cart"
              aria-label="장바구니"
              className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IoBagHandleOutline aria-hidden className="size-6" />
            </Link>
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(next) => void setTab(next as (typeof TABS)[number])}
        className="flex-1 gap-0"
      >
        {/* 밑줄 탭. 고른 것에 브랜드 색을 얹는 것은 시안 그대로다 */}
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-4 border-b border-border px-4 pb-2"
        >
          {TAB_LABEL.map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-none px-0 text-base after:bg-brand data-active:text-brand"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="live" className="flex flex-col">
          {dealOver ? (
            <EmptyState
              icon={<IoTimeOutline />}
              title="지금은 진행 중인 타임딜이 없어요"
              description={
                <>
                  새로운 타임딜이 열리면 알려드릴게요
                  <br />
                  다른 상품도 둘러보시겠어요?
                </>
              }
              // 시안에는 버튼이 없다. 물음만 남기면 갈 곳이 없어 링크를 붙였다
              action={
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/">상품 둘러보기</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
                <Countdown endsAt={endsAt} onEnd={() => setDealOver(true)} />
                <p className="text-sm text-muted-foreground">종료까지 남은 시간</p>
              </div>

              <ul className="flex flex-col">
                {LIVE_DEALS.map((deal) => {
                  const soldOut = deal.stock === "none";
                  const added = addedIds.includes(deal.id);
                  const badge = deal.stock === "enough" ? null : STOCK_BADGE[deal.stock];

                  return (
                    <li key={deal.id} className="border-b border-border last:border-b-0">
                      <ProductSummary
                        name={deal.name}
                        imageSize={24}
                        className={cn("px-4 py-3", soldOut && "opacity-50")}
                        imageBadge={
                          badge && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[0.625rem] font-bold",
                                badge.className,
                              )}
                            >
                              {badge.label}
                            </span>
                          )
                        }
                        meta={
                          <Price
                            amount={deal.price}
                            originalAmount={deal.originalPrice}
                            unitLabel={deal.unitLabel}
                            unitAmount={deal.unitAmount}
                          />
                        }
                        trailing={
                          <button
                            type="button"
                            disabled={soldOut}
                            aria-label={
                              soldOut
                                ? `${deal.name} 품절`
                                : added
                                  ? `${deal.name} 장바구니에 담김`
                                  : `${deal.name} 장바구니에 담기`
                            }
                            onClick={() =>
                              setPicked({
                                id: deal.id,
                                name: deal.name,
                                price: deal.price,
                                optionLabel: deal.optionLabel,
                                unitLabel: deal.unitLabel,
                                unitAmount: deal.unitAmount,
                              })
                            }
                            className={cn(
                              "flex size-11 items-center justify-center rounded-full border transition-colors",
                              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                              added
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-foreground hover:bg-muted",
                              soldOut && "border-transparent bg-muted",
                            )}
                          >
                            {added ? (
                              <IoCheckmark aria-hidden className="size-5" />
                            ) : (
                              <IoBagHandleOutline aria-hidden className="size-5" />
                            )}
                          </button>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="flex flex-col">
          <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
            {/* 알림을 신청했으면 초를 지켜볼 이유가 없다. 언제 열리는지만 남긴다 */}
            {notified ? (
              <p className="text-2xl font-bold text-foreground">{openLabel}</p>
            ) : (
              <Countdown
                endsAt={opensAt}
                fallback={<p className="text-2xl font-bold text-foreground">곧 열려요</p>}
              />
            )}
            <p className="text-sm text-muted-foreground">{openLabel}에 뵈요!</p>
          </div>

          <ul className="flex flex-col">
            {UPCOMING_DEALS.map((deal) => (
              <li key={deal.id} className="border-b border-border last:border-b-0">
                <ProductSummary
                  name={deal.name}
                  imageSize={24}
                  className="px-4 py-3"
                  meta={
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-brand">
                        예정 {deal.expectedRate}%
                      </span>
                      <span>{openLabel} 오픈</span>
                    </span>
                  }
                  trailing={
                    <span
                      aria-hidden
                      className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    >
                      <IoBagHandleOutline className="size-5" />
                    </span>
                  }
                />
              </li>
            ))}
          </ul>

          <div className="p-4">
            {/* 신청하고 나면 누를 것이 없다. 비활성 버튼으로 남기면 흐려져 완료로 읽히지 않고
                초점도 가지 않아 신청됐다는 것을 놓친다. 그래서 버튼이 아니라 상태로 바꾼다 */}
            {notified ? (
              <p
                role="status"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background"
              >
                <IoNotificationsOutline aria-hidden className="size-5" />
                오픈 알림 신청됨
              </p>
            ) : (
              <Button variant="secondary" onClick={() => setNotified(true)} className="min-h-11">
                <IoNotificationsOutline aria-hidden className="size-5" />
                오픈 알림 신청하기
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ProductOptionSheet
        product={picked}
        onOpenChange={(open) => !open && setPicked(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}
