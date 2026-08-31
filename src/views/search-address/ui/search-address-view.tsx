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

/** API 연동 전까지 화면 확인용 값 */
const MOCK_RESULTS: AddressResult[] = Array.from({ length: 4 }, () => ({
  zipNo: "06133",
  roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
  jibunAddr: "서울특별시 강남구 역삼동 848-23 아남빌딩",
  bdNm: "아남빌딩",
}));

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
