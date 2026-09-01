// 주소 검색 결과 목록. 우편번호·도로명·구주소를 항목 이름과 함께 보여준다.
// 와이어프레임 기준(mypa_312_검색결과)이라 디자인 확정 시 바뀔 수 있다.
//
// 행정안전부 도로명주소 API 응답 필드에 맞춘 형태다.

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
  className?: string;
};

export function AddressResultList({ results, onSelect, className }: AddressResultListProps) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {/* 같은 건물의 여러 호수처럼 표시값이 겹치는 결과가 올 수 있어 순번을 함께 쓴다 */}
      {results.map((result, index) => (
        <li key={`${index}-${result.zipNo}-${result.roadAddr}`} className="border-b border-border">
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="flex w-full flex-col gap-1 px-2 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* 시안은 세 항목만 보여준다. 건물명은 도로명에 이미 들어 있다 */}
            <span className="flex gap-2 text-sm">
              <span className="w-14 shrink-0 font-medium text-foreground">우편번호</span>
              <span className="text-muted-foreground">{result.zipNo}</span>
            </span>
            <span className="flex gap-2 text-sm">
              <span className="w-14 shrink-0 font-medium text-foreground">도로명</span>
              <span className="text-muted-foreground">{result.roadAddr}</span>
            </span>
            <span className="flex gap-2 text-sm">
              <span className="w-14 shrink-0 font-medium text-foreground">구주소</span>
              <span className="text-muted-foreground">{result.jibunAddr}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
