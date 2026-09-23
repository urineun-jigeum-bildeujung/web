// 상품 정보 탭의 내용. 상세 설명 표와 영양 성분 분석, 상품 설명 자리를 담는다.
// 와이어프레임 기준(상품상세)이라 디자인 확정 시 바뀔 수 있다.
//
// 영양 성분 분석이 이 탭의 핵심이다. 성분표를 그대로 옮겨 적는 대신 우리 아이
// 기준으로 어디에 있는지를 보여주는 것이, 이 서비스가 하겠다고 한 일이다.

import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { Icon } from "@/shared/ui/icon/icon";

import type { ProductDetailInfo } from "@/entities/product";

import type { PetMatch } from "../model/mock-product";
import { MOCK_PRODUCT } from "../model/mock-product";
import { DescriptionCollapse } from "./description-collapse";
import { NutrientBar } from "./nutrient-bar";

type ProductInfoPanelProps = {
  /** 상세 설명 표가 그대로 쓰는 응답값 */
  detail: ProductDetailInfo;
  /** 제공고시의 품명. 응답의 상품명을 그대로 쓴다 */
  productName: string;
  match: PetMatch;
  petName?: string;
};

/**
 * 응답을 상세 설명 표의 아홉 줄로 옮긴다. 항목명은 시안의 말이라 화면이 쥔다.
 *
 * **빈 값은 줄째로 뺀다.** "제조국 —"처럼 항목명만 남은 줄은 알려주는 것이 없다.
 * `cautions`는 이 표에 자리가 없다 — 경고로 쓸 값이라 따로 다룬다(#414).
 */
function toSpecRows(detail: ProductDetailInfo): [string, string][] {
  const feedingTarget = [detail.feedingTarget, detail.targetBreedSize, detail.targetAgeGroup]
    .filter(Boolean)
    .join(" · ");
  const shelfLife = [
    detail.consumptionPeriodDisplay,
    detail.shelfLifeAfterOpeningDays && `개봉 후 ${detail.shelfLifeAfterOpeningDays}일`,
  ]
    .filter(Boolean)
    .join(" · ");

  const rows: [string, string][] = [
    ["제조사/브랜드", [detail.manufacturer, detail.brandName].filter(Boolean).join(" / ")],
    ["제조국", detail.originCountry],
    [
      "제품 용량",
      detail.netQuantityValue ? `${detail.netQuantityValue}${detail.netQuantityUnit}` : "",
    ],
    ["원재료명", detail.ingredients?.join(", ") ?? ""],
    ["급여 대상", feedingTarget],
    ["급여 방법", detail.feedingMethod],
    // 응답의 allergens는 **들어 있는** 알레르기 유발 성분이다. 예전 목 문구는
    // "계란 · 유제품 불포함"이었는데 뜻이 반대라 그대로 쓰지 않는다
    ["알레르기 정보", detail.allergens?.map((allergen) => allergen.displayName).join(" · ") ?? ""],
    ["소비기한", shelfLife],
    ["보관방법", detail.storageMethod],
  ];

  return rows.filter(([, description]) => description !== "");
}

const GUIDE_TRIGGER_CLASS =
  "h-11 items-center rounded-none border-0 py-0 text-body-medium-14 text-text-body-default hover:no-underline [&_svg[data-slot=accordion-trigger-icon]]:hidden!";

const PENDING_GUIDES = [
  { value: "shipping", label: "배송 안내" },
  { value: "returns", label: "교환/반품/환불 안내" },
] as const;

const NUTRIENT_LEGEND = [
  { label: "부족", src: "/images/product-detail/nutrient-legend-low.svg" },
  { label: "적정", src: "/images/product-detail/nutrient-legend-proper.svg" },
  { label: "과다", src: "/images/product-detail/nutrient-legend-high.svg" },
] as const;

export function ProductInfoPanel({ detail, productName, match, petName }: ProductInfoPanelProps) {
  const specRows = toSpecRows(detail);
  return (
    <div className="flex flex-col">
      <section aria-labelledby="spec-heading" className="p-5">
        <h3 id="spec-heading" className="pb-2 text-title-bold-18 text-text-body-default">
          상세 설명
        </h3>
        <dl className="flex flex-col">
          {specRows.map(([term, description]) => (
            <DefinitionRow
              key={term}
              term={term}
              description={description}
              // 표 안에서는 값이 길어도 잘리지 않고 줄이 바뀌어야 읽힌다. 시안(1716-34202)처럼
              // 행 높이를 min-h로 고정하지 않고 값이 두 줄이면 항목명이 첫 줄에 맞도록
              // items-start로 정렬한다
              className="min-h-0 items-start gap-4 border-b border-border px-0 last:border-b-0 [&>dd]:whitespace-normal"
              termClassName="w-22 text-label-medium-14 text-text-body-default"
              descriptionClassName="text-body-medium-14 text-text-body-secondary"
            />
          ))}
        </dl>
      </section>

      <div className="h-2 bg-muted" />

      <section aria-labelledby="nutrient-heading" className="p-5">
        <div className="flex flex-col gap-2">
          <h3 id="nutrient-heading" className="text-title-bold-18 text-text-body-default">
            영양 성분 분석
          </h3>
          <ul
            aria-label="영양 성분 상태 범례"
            className="flex items-center gap-2 text-body-medium-14 text-text-body-secondary"
          >
            {NUTRIENT_LEGEND.map(({ label, src }) => (
              <li key={label} className="flex items-center gap-1">
                <Image src={src} alt="" width={8} height={8} unoptimized />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {match.nutrients.length === 0 ? (
          <p className="pt-3 text-sm text-muted-foreground">
            {petName ? `${petName} 기준의 급여량이 ` : "급여 기준이 "}
            등록되지 않아 아직 분석하지 못했어요.
          </p>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {match.nutrients.map((nutrient) => (
                <li key={nutrient.name}>
                  <NutrientBar nutrient={nutrient} />
                </li>
              ))}
            </ul>

            {/* 성분은 있는데 종합 점수를 못 받는 경우가 있다. 한 줄만 그리면
                "종합 점 — "처럼 글자가 빠진 문장이 남으므로 카드 전체를 함께 가린다 */}
            {match.score !== null && match.summary && (
              <div className="mt-4 flex flex-col rounded-xl bg-surface-brand-weak px-2 py-3 text-text-body-brand-strong">
                <p className="text-label-bold-14">종합 {match.score}점</p>
                <p className="text-body-medium-14">{match.summary}</p>
                <p className="text-body-medium-14">기능성 성분 - {match.functions}</p>
              </div>
            )}
          </>
        )}
      </section>

      <div className="h-2 bg-muted" />

      <section aria-label="상품 설명" className="px-5 py-4">
        <DescriptionCollapse />
      </section>

      <div className="h-2 bg-muted" />

      <Accordion type="single" collapsible className="bg-surface-default px-5">
        <AccordionItem value="notice" className="not-last:border-b-0">
          <AccordionTrigger className={GUIDE_TRIGGER_CLASS}>
            상품정보 제공고시
            <Icon
              name="down"
              className="text-icon-fill-default transition-transform group-aria-expanded/accordion-trigger:rotate-180"
            />
          </AccordionTrigger>
          <AccordionContent>
            <dl className="flex flex-col">
              {[["품명 및 모델명", productName] as const, ...MOCK_PRODUCT.notice].map(
                ([term, description]) => (
                  <DefinitionRow
                    key={term}
                    term={term}
                    description={description}
                    className="min-h-0 items-start gap-4 border-b border-border px-0 last:border-b-0 [&>dd]:whitespace-normal"
                    termClassName="w-22 text-label-medium-14 text-text-body-default"
                    descriptionClassName="text-body-medium-14 text-text-body-secondary"
                  />
                ),
              )}
            </dl>
          </AccordionContent>
        </AccordionItem>
        {PENDING_GUIDES.map(({ value, label }) => (
          <AccordionItem key={value} value={value} className="not-last:border-b-0">
            <AccordionTrigger className={GUIDE_TRIGGER_CLASS}>
              {label}
              <Icon
                name="down"
                className="text-icon-fill-default transition-transform group-aria-expanded/accordion-trigger:rotate-180"
              />
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-body-medium-14 text-text-body-secondary">
                안내 내용을 준비하고 있어요.
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
