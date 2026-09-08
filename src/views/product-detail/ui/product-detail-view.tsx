// 상품 상세 화면.
// 와이어프레임 기준(상품상세)이며 섹션 라벨이 아직 `수정 진행 예정`이라 바뀔 수 있다.
//
// 위에서부터 상품 자체 → 우리 아이에게 맞는지 → 함께 볼 것 → 자세한 정보 순으로 놓인다.
// 적합도를 가격 바로 아래 두는 것이 이 화면의 뜻이다. 스펙을 다 읽고 나서야
// 판단하게 하지 않고, 살지 말지를 정하는 자리에서 근거를 먼저 보인다.
//
// 적합도·영양 분석은 서버가 계산해 내려줄 값이라 지금은 `model/mock-product`의 목이다(#123).

"use client";

import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoBagHandleOutline, IoHeart, IoHeartOutline, IoShareOutline } from "react-icons/io5";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Price } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Rating } from "@/shared/ui/rating/rating";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { MOCK_PETS, MOCK_PRODUCT, PET_MATCHES, RELATED_PRODUCTS } from "../model/mock-product";
import { MatchPanel } from "./match-panel";
import { ProductInfoPanel } from "./product-info-panel";

const TABS = ["info", "review", "qna"] as const;

const TAB_LABEL = [
  ["info", "상품 정보"],
  ["review", "리뷰"],
  ["qna", "Q&A"],
] as const;

type ProductDetailViewProps = {
  productId: string;
};

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  // 고른 탭에 따라 보이는 것이 통째로 달라진다. nuqs 기본은 replace라
  // 그대로 두면 뒤로가기가 탭 전환을 건너뛰고 화면을 떠난다
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(TABS).withDefault("info").withOptions({ history: "push" }),
  );

  const [petId, setPetId] = useState(MOCK_PETS[0].id);
  const [liked, setLiked] = useState(false);

  // 이름도 여기서 함께 온다. 아이 목록에서 따로 찾으면 폴백이 걸렸을 때
  // 이름과 근거가 서로 다른 아이 것이 된다
  const match = PET_MATCHES.find((item) => item.petId === petId) ?? PET_MATCHES[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        right={
          <Link
            href="/cart"
            aria-label="장바구니"
            className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <IoBagHandleOutline aria-hidden className="size-6" />
          </Link>
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

        <section aria-labelledby="product-heading" className="flex flex-col gap-4 px-4 py-5">
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 id="product-heading" className="text-xl font-bold text-foreground">
                {MOCK_PRODUCT.name}
              </h1>
              <span className="flex items-center gap-2">
                <Rating value={MOCK_PRODUCT.rating} showValue />
                <Link
                  href={`/products/${productId}/reviews`}
                  className="text-sm text-muted-foreground underline underline-offset-4"
                >
                  후기 {MOCK_PRODUCT.reviewCount}
                </Link>
              </span>
            </div>

            <button
              type="button"
              aria-label="공유하기"
              // 복사한 척만 하면 사용자는 붙여넣을 것이 없는 채로 나간다.
              // 안전한 문맥이 아니면 clipboard가 아예 없으므로 실패도 알린다
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("링크를 복사했어요");
                } catch {
                  toast.error("링크를 복사하지 못했어요");
                }
              }}
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IoShareOutline aria-hidden className="size-6" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Price
              amount={MOCK_PRODUCT.price}
              originalAmount={MOCK_PRODUCT.originalPrice}
              size="lg"
            />
            <Button asChild variant="default" className="min-h-11 shrink-0">
              <Link href="/compare/select">비교하기</Link>
            </Button>
          </div>

          <dl className="flex flex-col border-t border-border">
            <DefinitionRow
              term="배송"
              description={MOCK_PRODUCT.shipping}
              className="items-start border-b border-border px-0 [&>dd]:whitespace-normal"
            />
            <DefinitionRow
              term="배송비"
              description={MOCK_PRODUCT.shippingFee}
              className="items-start border-b border-border px-0 [&>dd]:whitespace-normal"
            />
            <DefinitionRow term="판매자" description={MOCK_PRODUCT.seller} className="px-0" />
          </dl>
        </section>

        <div className="h-2 bg-muted" />

        <MatchPanel pets={MOCK_PETS} onPetChange={setPetId} match={match} />

        <div className="h-2 bg-muted" />

        <section aria-labelledby="related-heading" className="flex flex-col gap-3 px-4 py-5">
          <h2 id="related-heading" className="text-base font-bold text-foreground">
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
                  meta={
                    <span className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {product.unitLabel} {product.unitAmount.toLocaleString("ko-KR")}원
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Rating value={product.rating} showValue />
                        <span aria-hidden>|</span>
                        후기 {product.reviewCount}
                      </span>
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
          className="gap-0"
        >
          <TabsList
            variant="line"
            className="h-auto w-full border-b border-border px-4 pb-2 [&>*]:flex-1"
          >
            {TAB_LABEL.map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="min-h-11 text-base">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="info">
            <ProductInfoPanel match={match} petName={match.petName} />
          </TabsContent>

          {/* 리뷰와 문의는 목록 화면이 따로 있다. 여기서는 들어가는 길만 낸다 */}
          <TabsContent value="review" className="flex flex-col gap-3 px-4 py-5">
            <span className="flex items-center gap-2">
              <Rating value={MOCK_PRODUCT.rating} showValue size="md" />
              <span className="text-sm text-muted-foreground">
                후기 {MOCK_PRODUCT.reviewCount}개
              </span>
            </span>
            <Button asChild variant="outline" className="min-h-11">
              <Link href={`/products/${productId}/reviews`}>리뷰 전체 보기</Link>
            </Button>
          </TabsContent>

          <TabsContent value="qna" className="flex flex-col gap-3 px-4 py-5">
            <p className="text-sm text-muted-foreground">
              아직 등록된 문의가 없어요. 궁금한 점은 고객센터로 남겨주세요.
            </p>
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/mypage/support">문의하기</Link>
            </Button>
          </TabsContent>
        </Tabs>
      </main>

      <BottomActionBar>
        <button
          type="button"
          aria-label={liked ? "찜 목록에서 빼기" : "찜 목록에 담기"}
          aria-pressed={liked}
          onClick={() => {
            setLiked(!liked);
            if (!liked) toast.success("해당 상품을 찜 목록에 담았어요!");
          }}
          className="flex size-11 flex-none! items-center justify-center rounded-md border border-border transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {liked ? (
            <IoHeart aria-hidden className="size-6 text-brand" />
          ) : (
            <IoHeartOutline aria-hidden className="size-6 text-foreground" />
          )}
        </button>
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => toast.success("장바구니에 담겼어요")}
        >
          장바구니
        </Button>
        <Button asChild className="min-h-11">
          <Link href="/payment">바로 구매</Link>
        </Button>
      </BottomActionBar>
    </div>
  );
}
