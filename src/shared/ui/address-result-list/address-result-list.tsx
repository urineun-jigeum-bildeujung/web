// 주소 검색 결과 목록. 우편번호와 도로명·지번을 함께 보여준다.
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
      {results.map((result) => (
        <li key={`${result.zipNo}-${result.roadAddr}`} className="border-b border-border">
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="flex w-full flex-col gap-1 px-2 py-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="text-xs font-semibold text-muted-foreground">{result.zipNo}</span>
            <span className="flex gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">도로명</span>
              <span className="text-foreground">{result.roadAddr}</span>
            </span>
            <span className="flex gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">지번</span>
              <span className="text-foreground">{result.jibunAddr}</span>
            </span>
            {result.bdNm && (
              <span className="flex gap-2 text-sm">
                <span className="shrink-0 text-muted-foreground">건물명</span>
                <span className="text-foreground">{result.bdNm}</span>
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
