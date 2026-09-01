// 반려동물 프로필 관리. 아이의 정보와 그 아이가 먹은 제품을 탭으로 나눠 보여준다.
// 와이어프레임 기준(mypa_021, mypa_021_상품클릭시)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { IoChevronForward, IoImageOutline } from "react-icons/io5";

import {
  PetSwitcher,
  ProductReviewSheet,
  type PetProductReview,
  type PetSummary,
} from "@/entities/pet";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["profile", "products"] as const;

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PETS: PetSummary[] = [
  { id: "1", name: "코코" },
  { id: "2", name: "보리" },
];

const MOCK_PROFILE = {
  name: "코코",
  meta: "종 · 나이 · 성별",
  weight: "bcs",
  concerns: ["눈물자국", "체중"],
  allergies: ["복숭아"],
};

const MOCK_PRODUCTS = Array.from({ length: 4 }, (_, index) => ({
  id: String(index + 1),
  boughtAt: "26.08.28",
  goodCount: 3,
  badCount: 1,
}));

const MOCK_REVIEW: PetProductReview = {
  productName: "상품명",
  goodPoints: ["좋은 점 1", "좋은 점 2", "좋은 점 3"],
  badPoints: ["아쉬운 점 1", "아쉬운 점 2", "아쉬운 점 3"],
};

/** 요약 줄. 고칠 화면이 있으면 눌러서 넘어간다 */
function SummaryRow({
  title,
  children,
  href,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-sm font-bold text-foreground">{title}</span>
        {children}
      </span>
      {href && <IoChevronForward aria-hidden className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );

  const className =
    "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left border-b border-border";

  return href ? (
    <Link
      href={href}
      className={`${className} transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {item}
        </span>
      ))}
    </span>
  );
}

export function PetProfileView() {
  const router = useRouter();
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("profile"));
  const [selectedPetId, setSelectedPetId] = useState(MOCK_PETS[0].id);
  const [review, setReview] = useState<PetProductReview | null>(null);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as (typeof TABS)[number])}
        className="flex flex-1 flex-col"
      >
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">
            내 아이 관리
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1">
            아이 제품 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-1 flex-col">
          {/* 사진과 그 위에 겹치는 변경 버튼 */}
          <div className="relative flex aspect-square w-full items-center justify-center bg-muted">
            <IoImageOutline aria-hidden className="size-12 text-muted-foreground" />
            <Link
              href="/mypage/pets/basic"
              className="absolute bottom-4 rounded-full bg-foreground/70 px-3 py-1.5 text-xs text-background"
            >
              사진 변경
            </Link>
          </div>

          <div className="flex flex-col">
            <SummaryRow
              title={
                <span className="flex items-baseline gap-2">
                  {MOCK_PROFILE.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    {MOCK_PROFILE.meta}
                  </span>
                </span>
              }
              href="/mypage/pets/basic"
            />
            <SummaryRow
              title={
                <span className="flex items-baseline gap-2">
                  몸무게
                  <span className="text-xs font-normal text-muted-foreground">
                    {MOCK_PROFILE.weight}
                  </span>
                </span>
              }
              href="/mypage/pets/body"
            />
            <SummaryRow title="걱정되는 질환" href="/mypage/pets/health">
              <Chips items={MOCK_PROFILE.concerns} />
            </SummaryRow>
            <SummaryRow title="가지고 있는 알러지">
              <Chips items={MOCK_PROFILE.allergies} />
            </SummaryRow>
          </div>
        </TabsContent>

        <TabsContent value="products" className="flex flex-1 flex-col gap-4 px-4 pt-2">
          {MOCK_PRODUCTS.map((product) => (
            <article key={product.id} className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">구매일 {product.boughtAt}</p>
              <button
                type="button"
                onClick={() => setReview(MOCK_REVIEW)}
                className="rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <ProductSummary
                  name="상품명"
                  meta={
                    <span className="flex flex-col gap-1">
                      상품 옵션
                      <span className="flex gap-3 text-xs">
                        <span>좋았던 점 {product.goodCount}</span>
                        <span>아쉬운 점 {product.badCount}</span>
                      </span>
                    </span>
                  }
                />
              </button>
            </article>
          ))}
        </TabsContent>
      </Tabs>

      <PetSwitcher
        pets={MOCK_PETS}
        selectedId={selectedPetId}
        onSelect={setSelectedPetId}
        className="sticky bottom-0 border-t border-border bg-background"
        onAdd={() => router.push("/mypage/pets/new")}
      />

      <ProductReviewSheet review={review} onOpenChange={(open) => !open && setReview(null)} />
    </div>
  );
}
