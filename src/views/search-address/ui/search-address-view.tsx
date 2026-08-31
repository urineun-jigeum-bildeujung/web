// 주소 검색. 검색어를 받아 결과를 우리 화면에 그린다.
// 와이어프레임 기준(mypa_312_입력전, 검색결과, mypa_312)이라 디자인 확정 시 바뀔 수 있다.
//
// 디자인팀이 화면 커스텀을 요청해 다음 우편번호 위젯을 쓰지 않는다.
// 행정안전부 도로명주소 API를 백엔드 프록시로 호출할 예정이며 지금은 목 데이터다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AddressResultList,
  type AddressResult,
} from "@/shared/ui/address-result-list/address-result-list";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

/** API 연동 전까지 화면 확인용 값. 건물명이 없는 결과도 섞어 둔다 */
const MOCK_RESULTS: AddressResult[] = [
  {
    zipNo: "06133",
    roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 848-23 아남빌딩",
    bdNm: "아남빌딩",
  },
  {
    zipNo: "06234",
    roadAddr: "서울특별시 강남구 테헤란로 152 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 737 강남파이낸스센터",
    bdNm: "강남파이낸스센터",
  },
  {
    zipNo: "06236",
    roadAddr: "서울특별시 강남구 테헤란로 419 (삼성동)",
    jibunAddr: "서울특별시 강남구 삼성동 168-26",
  },
  {
    zipNo: "06158",
    roadAddr: "서울특별시 강남구 테헤란로 501 (삼성동)",
    jibunAddr: "서울특별시 강남구 삼성동 143-40 브이플렉스",
    bdNm: "브이플렉스",
  },
];

/** 검색어를 어떻게 넣는지 보여주는 예시 (mypa_312_입력전) */
const SEARCH_EXAMPLES = [
  { label: "도로명", example: "예) 무학로 33, 도산대로 8길 23" },
  { label: "동주소", example: "예) 연희동 42-18" },
  { label: "건물명", example: "예) 역삼동 푸르지오, 텐즈힐" },
];

export function SearchAddressView() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<AddressResult[] | null>(null);
  const [selected, setSelected] = useState<AddressResult | null>(null);

  const search = () => setResults(keyword.trim() ? MOCK_RESULTS : []);

  return (
    <SingleInputScreen
      question="주소를 입력해주세요"
      submitDisabled={!selected}
      onSubmit={() => router.back()}
    >
      <div className="flex items-start gap-2">
        <FormField
          label="주소 검색어"
          className="flex-1 [&>label]:sr-only"
          placeholder="예) 테헤란로 123"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onClear={() => setKeyword("")}
        />
        <Button className="min-h-11 shrink-0" disabled={!keyword.trim()} onClick={search}>
          검색
        </Button>
      </div>

      {/* 어떻게 찾아야 하는지 알려주는 예시. 검색 전에만 보인다 (mypa_312_입력전) */}
      {results === null && (
        <dl className="flex flex-col gap-2 text-xs">
          {SEARCH_EXAMPLES.map((item) => (
            <div key={item.label} className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground">{item.label}</dt>
              <dd className="text-muted-foreground">{item.example}</dd>
            </div>
          ))}
        </dl>
      )}

      {results !== null &&
        (results.length > 0 ? (
          <AddressResultList results={results} onSelect={setSelected} />
        ) : (
          <EmptyState
            title="검색 결과가 없어요"
            description="도로명이나 건물명으로 다시 찾아보세요."
          />
        ))}
    </SingleInputScreen>
  );
}
