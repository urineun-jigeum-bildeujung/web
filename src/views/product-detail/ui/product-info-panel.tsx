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

import { PRODUCT_GUIDES } from "../config/guide-sections";
import type { PetMatch } from "../model/mock-product";
import { DescriptionCollapse } from "./description-collapse";
import { NutrientBar } from "./nutrient-bar";

type ProductInfoPanelProps = {
  /** 상세 설명 표가 그대로 쓰는 응답값 */
  detail: ProductDetailInfo;
  match: PetMatch;
  petName?: string;
};

/**
 * 종 표시명과 체구 뒤에 붙는 접미. 백엔드 `Species`는 `강아지`·`고양이` 둘뿐이고,
 * 응답의 `targetSpecies`가 `Set`이라 순서가 보장되지 않아 이 순서로 고정해 적는다.
 */
const SPECIES_SUFFIX = [
  ["강아지", "견"],
  ["고양이", "묘"],
] as const;

/**
 * 응답을 상세 설명 표의 아홉 줄로 옮긴다. 항목명은 시안의 말이라 화면이 쥔다.
 *
 * **빈 값은 줄째로 뺀다.** "제조국 —"처럼 항목명만 남은 줄은 알려주는 것이 없다.
 * `cautions`는 이 표에 자리가 없다 — 경고로 쓸 값이라 따로 다룬다(#414).
 */
function toSpecRows(detail: ProductDetailInfo): [string, string][] {
  // 급여 대상은 시안(1702-18844)처럼 "8세 이상 소형견" 한 문구로 적는다. 종은 늘 맨 뒤에 오고,
  // 체구가 있으면 접미로 줄고(소형견) 없으면 이름 그대로 선다(강아지). `targetAgeGroup`은 적지
  // 않는다 — `feedingTarget`("8세 이상")과 같은 사실을 두 번 적는 꼴이고 시안에도 없다
  const species = SPECIES_SUFFIX.filter(([name]) => detail.targetSpecies.includes(name));
  const targetPart = detail.targetBreedSize
    ? `${detail.targetBreedSize}${species.map(([, suffix]) => suffix).join("·")}`
    : species.map(([name]) => name).join("·");
  const feedingTarget = [detail.feedingTarget, targetPart].filter(Boolean).join(" ");
  const allergens = detail.allergens.map((allergen) => allergen.displayName).join(" · ");
  const rows: [string, string][] = [
    ["제조사/브랜드", [detail.manufacturer, detail.brandName].filter(Boolean).join(" / ")],
    ["제조국", detail.originCountry ?? ""],
    [
      "제품 용량",
      detail.netQuantityValue ? `${detail.netQuantityValue}${detail.netQuantityUnit}` : "",
    ],
    ["원재료명", detail.ingredients.join(", ")],
    ["급여 대상", feedingTarget],
    ["급여 방법", detail.feedingMethod ?? ""],
    // 응답의 allergens는 **들어 있는** 알레르기 유발 성분이다. 시안 문구가
    // "계란 · 유제품 불포함"이라 성분명만 적으면 뜻이 정반대로 읽혀서 "포함"을 붙인다.
    // 성분이 없으면 줄째로 빠진다 — 불포함이라고 단정하려면 전체 알레르겐 목록이 필요하다
    ["알레르기 정보", allergens && `${allergens} 포함`],
    // 응답의 shelfLifeAfterOpeningDays는 적지 않는다. 시안(1702-18859)은 소비기한 값이
    // "제조일로부터 18개월" 한 덩어리고 개봉 후 일수를 붙일 자리가 없다
    ["소비기한", detail.consumptionPeriodDisplay ?? ""],
    ["보관방법", detail.storageMethod ?? ""],
  ];

  // null·빈 문자열 둘 다 걸러낸다. 응답의 절반 가까이가 빌 수 있는 열이다
  return rows.filter(([, description]) => Boolean(description));
}

const GUIDE_TRIGGER_CLASS =
  "h-11 items-center rounded-none border-0 py-0 text-body-medium-14 text-text-body-default hover:no-underline [&_svg[data-slot=accordion-trigger-icon]]:hidden!";

const NUTRIENT_LEGEND = [
  { label: "부족", src: "/images/product-detail/nutrient-legend-low.svg" },
  { label: "적정", src: "/images/product-detail/nutrient-legend-proper.svg" },
  { label: "과다", src: "/images/product-detail/nutrient-legend-high.svg" },
] as const;

export function ProductInfoPanel({ detail, match, petName }: ProductInfoPanelProps) {
  const specRows = toSpecRows(detail);
  return (
    <div className="flex flex-col">
      <section aria-labelledby="spec-heading" className="p-5">
        <h3 id="spec-heading" className="pb-2 text-title-bold-18 text-text-body-default">
          상세 설명
        </h3>
        {/* 폭이 넓어지면 항목이 옆으로 눕는다(시안 2679-41337). **전환점을 잡지 않는다** —
            한 줄을 353px로 고정하고 사이를 22px 띄우면 393에서 하나, 768에서 둘,
            1143부터 셋이 된다. `lg:`(1024)로 세 칸을 강제하면 1024~1142에서 줄을 넘는다.
            구분선은 줄 전체가 아니라 항목마다 따로 간다 — 그래서 `divide-y`가 아니라
            각 행이 `border-b`를 갖는다 */}
        <dl className="flex flex-wrap gap-x-5.5">
          {specRows.map(([term, description]) => (
            <DefinitionRow
              key={term}
              term={term}
              description={description}
              // 표 안에서는 값이 길어도 잘리지 않고 줄이 바뀌어야 읽힌다. 시안(1716-34202)처럼
              // 행 높이를 min-h로 고정하지 않고 값이 두 줄이면 항목명이 첫 줄에 맞도록
              // items-start로 정렬한다
              className="min-h-0 w-full max-w-88.25 items-start gap-4 border-b border-border px-0 [&>dd]:whitespace-normal"
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
            {petName ? `${petName} 기준으로는 ` : ""}아직 분석하지 못했어요.
          </p>
        ) : (
          <>
            {/* 상세 설명 표와 같은 규칙으로 눕는다(시안 2679-41419) — 353px 고정에 사이 22px.
                **구분선을 `divide-y`로 주지 않는다.** 그것은 세로 한 줄을 전제해서, 옆으로
                누우면 줄 전체를 가로지르는 선이 생긴다. 시안은 항목마다 따로 긋는다 */}
            <ul className="flex flex-wrap gap-x-5.5">
              {match.nutrients.map((nutrient) => (
                <li
                  key={nutrient.name}
                  className="w-full max-w-88.25 border-b border-border last:border-b-0"
                >
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
        {PRODUCT_GUIDES.map(({ value, label, sections }) => (
          <AccordionItem key={value} value={value} className="not-last:border-b-0">
            <AccordionTrigger className={GUIDE_TRIGGER_CLASS}>
              {label}
              <Icon
                name="down"
                className="text-icon-fill-default transition-transform group-aria-expanded/accordion-trigger:rotate-180"
              />
            </AccordionTrigger>
            {/* `AccordionContent`는 문단마다 `mb-4`를 붙인다. 이 안내는 줄 간격만으로 붙여 읽는
                글이라(시안 3756-73239) 같은 변형 체인으로 0으로 덮는다 — 접두사가 다르면 안 이긴다 */}
            <AccordionContent className="[&_p:not(:last-child)]:mb-0">
              <div className="flex flex-col pb-2">
                {sections.map((section) => (
                  // 묶음 사이 간격은 시안에 빈 줄이 있는 자리에만 준다. 본문 한 줄 높이(18px)다
                  <div
                    key={section.heading}
                    className={section.spacedBefore ? "mt-4.5" : undefined}
                  >
                    {/* 아코디언 줄 제목이 h3(Radix `AccordionHeader`)이라 그 아래는 h4다.
                        시안의 소제목은 본문과 굵기가 같고 크기·색만 다르다 */}
                    <h4 className="text-caption-regular-13 text-text-body-default">
                      {section.heading}
                    </h4>
                    {section.lines.map((line) => (
                      <p
                        key={line}
                        className="text-caption-regular-12 break-keep text-text-body-secondary"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
