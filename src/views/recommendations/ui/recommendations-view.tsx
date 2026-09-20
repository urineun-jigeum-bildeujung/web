// 고른 아이에게 맞는 상품을 모아 보여준다.
// UI 시안 기준(#273, 1576-87320)이다. 헤더는 시안(로고+검색+알림+장바구니)과 달리
// 뒤로가기 있는 PageHeader를 쓴다 — 메인 "맞춤 추천"의 "더보기"로 들어가는 서브
// 화면이라 사용자 흐름상 뒤로 갈 방법이 있어야 해서 우선 이렇게 두었고, 시안대로
// 바꿀지는 프디팀 확인 후 정한다.

"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { BottomNav } from "@/widgets/bottom-nav";
import { MatchScoreBadge } from "@/entities/product";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PETS = [
  { id: "1", name: "코코" },
  { id: "2", name: "봄이" },
];

// 건강 고민 칩(관절·알러지·구강관리)은 이 시안에 없다. home-view와 같은 상품 분류
// 탭(전체·사료·간식·영양제)으로 거른다
const CATEGORIES = ["all", "food", "snack", "supplement"] as const;
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  all: "전체",
  food: "사료",
  snack: "간식",
  supplement: "영양제",
};

// home-view의 정렬 드롭다운(1758-69122)과 같은 목록·순서다
const SORTS = [
  { value: "recommend", label: "추천순" },
  { value: "latest", label: "최신순" },
  { value: "rating-high", label: "별점 높은순" },
  { value: "rating-low", label: "별점 낮은순" },
] as const;
const SORT_VALUES = ["recommend", "latest", "rating-high", "rating-low"] as const;

// 정렬을 바꿔도 목록이 그대로면 안 되는 것처럼 보인다. matchScore·등록일·별점이
// 전부 index와 같은 방향으로만 움직이면 네 정렬 기준이 우연히 같은 순서를 낸다 —
// 등록일·별점을 index 순서와 일부러 다르게 섞어 서로 다른 순서가 나오게 한다
const MOCK_RATINGS = [4.9, 4.5, 4.8, 4.6, 5.0, 4.4, 4.7, 4.9, 4.5];
const MOCK_DAYS_AGO = [2, 6, 0, 4, 8, 1, 5, 3, 7];

const MOCK_PRODUCTS = Array.from({ length: 9 }, (_, index) => ({
  id: String(index + 1),
  name: "그레인프리 연어 사료 2kg",
  price: 31200,
  // 시안에 31,200원·20%·37,440원으로 적혀 있으나 그 둘로는 16%가 나온다.
  // 할인율은 화면에서 계산하므로 20%가 되는 값으로 둔다.
  originalPrice: 39000,
  dailyCost: 1050,
  rating: MOCK_RATINGS[index],
  reviewCount: 108,
  // 적합도는 AI가 주는 값이다. 단위가 정해지지 않아 0~100으로 둔다.
  matchScore: 92 - index * 7,
  // 어느 분류의 상품인지. 실제로는 AI가 골라 준다
  category: CATEGORIES[1 + (index % (CATEGORIES.length - 1))],
  // API 연동 전까지 최신순 정렬 확인용. 실제로는 서버가 등록일을 준다
  createdAt: new Date(Date.now() - MOCK_DAYS_AGO[index] * 86_400_000),
}));

/** 정렬 드롭다운 값에 맞춰 상품을 다시 늘어놓는다. home-view의 같은 함수와 기준이 같다 */
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

export function RecommendationsView() {
  // 아이 id는 서버에서 오는 값이라 보기를 미리 적을 수 없어 parseAsStringLiteral을 쓰지 못한다.
  // 대신 아래에서 목록에 없는 id면 첫 아이로 되돌린다
  const [petId, setPetId] = useQueryState("pet", parseAsString.withDefault(MOCK_PETS[0].id));
  // 주소로 아무 값이나 올 수 있다. 목록에 없는 값이면 목록이 통째로 비므로 보기 안에서만 받는다.
  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CATEGORIES).withDefault("all"),
  );
  // 필터·정렬은 URL 상태로 둔다(AGENTS.md) — 상품 상세로 갔다 돌아와도 유지돼야 한다
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_VALUES).withDefault("recommend"),
  );
  const [liked, setLiked] = useState<string[]>([]);

  const pet = MOCK_PETS.find((item) => item.id === petId) ?? MOCK_PETS[0];
  const filtered =
    category === "all"
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter((product) => product.category === category);
  const products = sortProducts(filtered, sort);

  const toggleLike = (id: string) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="맞춤 추천" />

      {/* 시안(홈화면 프레임 기준)은 상태 표시줄+헤더 아래로 12px을 두고 본문이 시작한다.
          다른 화면들도 PageHeader 다음에 pt-3을 공통으로 쓴다 */}
      <main className="flex flex-1 flex-col pt-3 pb-8">
        <div className="flex flex-col gap-2 px-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {/* 아이를 바꾸면 추천도 바뀐다. 시안(1576-87420)은 검정 알약 안에 이름+화살표만
                  두고 문장 첫머리에 잇는다. 보이는 높이는 32px, 누르는 자리만 44px로 넓힌다 */}
              {/* 주소에 없는 id가 와도 본문과 같은 아이를 가리키도록 정규화한 값을 쓴다 */}
              <Select value={pet.id} onValueChange={(next) => void setPetId(next)}>
                {/* 배경은 시안(1576-87505, button/bg/primary #2a3038)과 같은 surface-primary
                    토큰이다 — shadcn Button 기본 변형의 bg-primary와 같다. 화살표는 시안대로
                    20px 흰 아이콘으로 바꾸고, 시안에 없는 기본 테두리도 지운다 */}
                <SelectTrigger
                  aria-label="어느 아이의 추천을 볼지"
                  // 마지막 svg(공용 트리거의 기본 화살표)만 지운다 — 앞의 Icon은 남겨야 한다
                  className="relative h-8 w-auto gap-1 rounded-lg border-0 bg-primary px-3 py-2 text-label-medium-12 text-primary-foreground after:absolute after:-inset-y-1.5 [&>svg:last-child]:hidden"
                >
                  <SelectValue />
                  <Icon name="down" aria-hidden className="size-5" />
                </SelectTrigger>
                {/* 시안(1585-18052)은 흰 배경에 4px 안쪽 여백, 항목은 40px에 6px 모서리고
                    고른 항목도 체크 표시 없이 글자만 있다. 아이 선택 알약 바로 아래로 열리는
                    일반 드롭다운이라 position="popper"를 쓴다 */}
                <SelectContent position="popper" align="start" className="min-w-25 p-1">
                  {MOCK_PETS.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      className="h-10 rounded-md px-1.5 [&>span:first-child]:hidden"
                    >
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <h2 className="text-title-bold-20 break-keep text-foreground">
                의 건강 고민을 덜어줄
              </h2>
            </div>
            <p className="text-title-bold-20 text-foreground">맞춤 상품을 찾았어요</p>
          </div>

          {/* 시안(1576-87525)은 "안내" 라벨과 한 문장을 주황 카드에 담는다. InfoNotice는
              불릿 목록이라 여기엔 맞지 않는다 */}
          <p className="flex items-center gap-2 rounded-xl bg-surface-brand-weak px-2 py-3 text-body-medium-14 text-text-body-brand-strong">
            <span className="shrink-0 text-label-bold-14">안내</span>
            보호자님이 알려주신 건강 고민을 바탕으로 추천해요
          </p>
        </div>

        {/* 건강 고민 칩 대신 home-view와 같은 상품 분류 탭이다(1576-87434). 탭처럼 보이지만
            탭 역할을 주지 않는다 — 화면 구성이 바뀌는 게 아니라 같은 목록을 거를 뿐이다.
            지금 어느 것을 보고 있는지는 aria-current로 알린다 */}
        <nav aria-label="상품 분류" className="mt-4 flex px-5">
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

        {/* 시안(1576-87321)은 이 줄 높이가 22px뿐이다. 공용 트리거에 min-h-11을 주면
            그만큼 위아래 여백이 늘어나 탭·격자 사이가 시안보다 벌어진다 — 보이는 높이는
            그대로 두고 after:로 누르는 자리만 44px 채운다(home-view 정렬과 같은 기법) */}
        <div className="mt-1 flex items-center justify-end px-5">
          <Select
            value={sort}
            onValueChange={(next) => void setSort(next as (typeof SORT_VALUES)[number])}
          >
            <SelectTrigger
              aria-label="정렬"
              className="relative w-auto shrink-0 border-0 bg-transparent p-0 text-body-medium-14 text-text-body-secondary shadow-none after:absolute after:-inset-2.5 data-[size=default]:h-auto"
            >
              <SelectValue />
            </SelectTrigger>
            {/* home-view의 정렬 드롭다운(1758-69122)과 같은 패턴이다 — 트리거 아래로 열리는
                일반 드롭다운이라 position="popper"·오른쪽 정렬을 쓰고, 고른 항목은 체크
                아이콘 대신 배경색으로만 구분한다 */}
            <SelectContent position="popper" align="end" className="w-42.5 min-w-42.5 p-1">
              {SORTS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="h-10 rounded-md px-1.5 text-label-medium-14 data-[state=checked]:bg-surface-weak data-[state=checked]:font-bold [&>span:first-child]:hidden"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title={`${pet.name}에게 맞는 상품을 아직 찾지 못했어요`}
            description="아이 정보를 채우면 더 잘 골라드릴 수 있어요."
            className="flex-1"
          />
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-x-3.25 gap-y-3 px-5">
            {products.map((product) => (
              <li key={product.id} className="flex">
                <ProductGridCard
                  className="flex-1"
                  href={`/products/${product.id}`}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  // 적합도 배지는 이 화면 시안(1584-16064 등)이 홈과 다른 위치·색·문구를
                  // 쓰는데, Figma에 이 배지를 다른 화면과 통일할 예정이라는 코멘트가 있다.
                  // MatchScoreBadge는 home-view와 같이 쓰는 공용 컴포넌트라 지금 표기를
                  // 그대로 두고 통일 방향을 프디팀에 확인한다(README 참고)
                  imageBadge={<MatchScoreBadge score={product.matchScore} petName={pet.name} />}
                  // 찜 버튼은 32px 흰 원판(rounded-full) 위에 24px 아이콘, 사진 오른쪽
                  // 아래 4px 인셋이다(product-detail과 같은 위치). 원판은 시안이 불투명
                  // 흰색인데 이 프로젝트에 그 토큰이 없어 반투명 surface-overlay-static으로
                  // 근사했다(README 참고)
                  imageActionClassName="top-auto right-1 bottom-1"
                  imageAction={
                    // 비활성 #565D6D=text-body-secondary, 활성 #FF611D=brand — SVG fill을
                    // 토큰과 대조해 확인했다
                    <button
                      type="button"
                      onClick={() => toggleLike(product.id)}
                      aria-pressed={liked.includes(product.id)}
                      aria-label={`${product.name} 찜하기`}
                      className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-static after:absolute after:-inset-1.5"
                    >
                      {liked.includes(product.id) ? (
                        <Icon name="heart_fill" aria-hidden className="size-6 text-brand" />
                      ) : (
                        <Icon
                          name="heart_stroke"
                          aria-hidden
                          className="size-6 text-text-body-secondary"
                        />
                      )}
                    </button>
                  }
                  meta={
                    <>
                      <p className="text-xs text-muted-foreground">
                        하루 예상 급여비 약 {product.dailyCost.toLocaleString("ko-KR")}원
                      </p>
                      {/* 시안(1585-18006)은 5개 별점 줄이 아니라 별 1개(20px)+숫자, 구분선,
                          후기 수다. product-detail의 RatingSummary와 같은 모양이라 공용
                          Rating(5개 별, 리뷰 자체의 별점 표시용)과는 다른 이 마크업을 쓴다 */}
                      <span className="flex items-center gap-2">
                        <span className="sr-only">{`5점 만점에 ${product.rating}점`}</span>
                        <span aria-hidden className="flex items-center gap-0.5">
                          <Icon name="star" className="size-5 text-icon-fill-accent" />
                          <span className="text-body-medium-14 text-text-body-secondary">
                            {product.rating}
                          </span>
                        </span>
                        <span aria-hidden className="h-4 w-px bg-border" />
                        <span aria-hidden className="text-body-medium-14 text-text-body-secondary">
                          후기 {product.reviewCount}
                        </span>
                        <span className="sr-only">{`후기 ${product.reviewCount}개`}</span>
                      </span>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* 시안(1576-87320)의 navigation 인스턴스다. 시안은 "홈" 탭이 켜진 채로 그려 뒀지만,
          이 화면은 BottomNav의 네 경로(/, /compare, /likes, /mypage) 어디에도 안 속해
          있어 지금 컴포넌트로는 그 상태를 만들 수 없다 — 프디팀 확인 예정(README 참고) */}
      <BottomNav />
    </div>
  );
}
