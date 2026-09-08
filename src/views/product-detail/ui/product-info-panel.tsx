// 상품 정보 탭의 내용. 상세 설명 표와 영양 성분 분석, 상품 설명 자리를 담는다.
// 와이어프레임 기준(상품상세)이라 디자인 확정 시 바뀔 수 있다.
//
// 영양 성분 분석이 이 탭의 핵심이다. 성분표를 그대로 옮겨 적는 대신 우리 아이
// 기준으로 어디에 있는지를 보여주는 것이, 이 서비스가 하겠다고 한 일이다.

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";

import type { PetMatch } from "../model/mock-product";
import { MOCK_PRODUCT } from "../model/mock-product";
import { NutrientBar } from "./nutrient-bar";

type ProductInfoPanelProps = {
  match: PetMatch;
  petName?: string;
};

export function ProductInfoPanel({ match, petName }: ProductInfoPanelProps) {
  return (
    <div className="flex flex-col">
      <section aria-labelledby="spec-heading" className="px-4 py-5">
        <h3 id="spec-heading" className="pb-2 text-base font-bold text-foreground">
          상세 설명
        </h3>
        <dl className="flex flex-col">
          {MOCK_PRODUCT.spec.map(([term, description]) => (
            <DefinitionRow
              key={term}
              term={term}
              description={description}
              // 표 안에서는 값이 길어도 잘리지 않고 줄이 바뀌어야 읽힌다
              className="items-start gap-4 border-b border-border px-0 last:border-b-0 [&>dd]:whitespace-normal"
            />
          ))}
        </dl>
      </section>

      <div className="h-2 bg-muted" />

      <section aria-labelledby="nutrient-heading" className="px-4 py-5">
        <h3 id="nutrient-heading" className="text-base font-bold text-foreground">
          영양 성분 분석
        </h3>

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

            <div className="mt-4 flex flex-col gap-1 rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">기능성 성분 — {match.functions}</p>
              {/* 성분은 있는데 종합 점수를 못 받는 경우가 있다. 그대로 그리면
                  "종합 점 — "처럼 글자가 빠진 문장이 남는다 */}
              {match.score !== null && match.summary && (
                <p className="text-sm font-bold text-foreground">
                  종합 {match.score}점 — {match.summary}
                </p>
              )}
            </div>
          </>
        )}
      </section>

      <div className="h-2 bg-muted" />

      <section aria-label="상품 설명" className="px-4 py-5">
        {/* 판매자가 올리는 상세 이미지 자리다. 아직 받을 곳이 없어 자리만 잡는다 */}
        <div className="flex h-70 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
          상품 설명 영역
        </div>

        <Accordion type="single" collapsible className="pt-4">
          <AccordionItem value="description" className="rounded-lg border border-border px-4">
            <AccordionTrigger className="min-h-11 justify-center gap-2 text-sm font-medium">
              상품설명 더보기
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              상품 설명이 등록되면 이 자리에 펼쳐져요.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Accordion type="single" collapsible className="border-t border-border px-4">
        <AccordionItem value="notice" className="border-b-0">
          <AccordionTrigger className="min-h-11 text-base font-bold">
            상품정보 제공고시
          </AccordionTrigger>
          <AccordionContent>
            <dl className="flex flex-col">
              {MOCK_PRODUCT.notice.map(([term, description]) => (
                <DefinitionRow
                  key={term}
                  term={term}
                  description={description}
                  className="items-start gap-4 border-b border-border px-0 last:border-b-0 [&>dd]:whitespace-normal"
                />
              ))}
            </dl>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
