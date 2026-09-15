// 주소 검색 결과 목록. 우편번호·도로명·구주소를 항목 이름과 함께 보여준다.
// 와이어프레임 기준(mypa_312_검색결과)이라 디자인 확정 시 바뀔 수 있다.
//
// 행정안전부 도로명주소 API 응답 필드에 맞춘 형태다.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

export type AddressResult = {
  zipNo: string;
  roadAddr: string;
  jibunAddr: string;
  bdNm?: string;
};

type AddressResultListProps = {
  results: AddressResult[];
  onSelect: (result: AddressResult) => void;
  // `results`·`onSelect`는 ul의 기본 속성과 이름이 겹친다. 우리 뜻이 이기게 덜어낸다
} & Omit<ComponentProps<"ul">, "results" | "onSelect">;

/** 시안이 보여주는 세 줄. 건물명은 도로명에 이미 들어 있어 따로 적지 않는다 */
const ROWS = [
  { term: "우편번호", of: (result: AddressResult) => result.zipNo },
  { term: "도로명", of: (result: AddressResult) => result.roadAddr },
  { term: "구주소", of: (result: AddressResult) => result.jibunAddr },
];

export function AddressResultList({
  results,
  onSelect,
  className,
  ...props
}: AddressResultListProps) {
  return (
    // 시안은 항목 사이를 16px 띄우고 그 가운데에 선을 긋는다
    <ul className={cn("flex flex-col gap-4", className)} {...props}>
      {/* 같은 건물의 여러 호수처럼 표시값이 겹치는 결과가 올 수 있어 순번을 함께 쓴다 */}
      {results.map((result, index) => (
        <li key={`${index}-${result.zipNo}-${result.roadAddr}`} className="border-b border-border">
          {/* 시안에 눌린 상태 배경이 없다. 모바일이 기준이라 hover 대신 초점 표시만 남긴다 */}
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="flex w-full flex-col gap-2 pb-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {ROWS.map((row) => (
              <span key={row.term} className="flex gap-2">
                {/* 라벨 너비를 고정하지 않는다. 시안이 값을 라벨 바로 뒤에 붙인다 */}
                <span className="shrink-0 text-label-bold-14 text-foreground">{row.term}</span>
                <span className="text-body-regular-14 text-text-body-tertiary">
                  {row.of(result)}
                </span>
              </span>
            ))}
          </button>
        </li>
      ))}
    </ul>
  );
}
