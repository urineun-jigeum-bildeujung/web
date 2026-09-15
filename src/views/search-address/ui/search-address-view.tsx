// 주소 검색. 검색어를 받아 결과를 우리 화면에 그린다.
// UI 시안 기준(mypa_312_입력전, mypa_312, mypa_312_검색결과).
//
// 디자인팀이 화면 커스텀을 요청해 다음 우편번호 위젯을 쓰지 않는다.
// 행정안전부 도로명주소 API를 붙일 예정이며 지금은 목 데이터다. 누가 만들지는 백엔드팀 회신 대기 중.
//
// 고른 주소는 주소창에 실어 배송지 화면으로 돌려보낸다. 컴포넌트 상태로는 화면을 넘길 수 없다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import {
  AddressResultList,
  type AddressResult,
} from "@/shared/ui/address-result-list/address-result-list";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Input } from "@/shared/ui/input";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

/**
 * API 연동 전까지 화면 확인용 값. 건물명이 없는 결과도 섞어 둔다.
 * 지어낸 값이 아니라 행안부 API가 실제로 내려준 응답을 옮겼다 — 나중에 진짜 응답으로 바꿔도 화면이 그대로다.
 */
const MOCK_RESULTS: AddressResult[] = [
  {
    zipNo: "06133",
    roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 648-23 여삼빌딩",
    bdNm: "여삼빌딩",
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

/** 행안부 API가 한 글자 검색어를 거절한다(E0008). 보내기 전에 우리가 먼저 막는다 */
const MIN_KEYWORD_LENGTH = 2;

export function SearchAddressView() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<AddressResult[] | null>(null);
  const [selected, setSelected] = useState<AddressResult | null>(null);

  const canSearch = keyword.trim().length >= MIN_KEYWORD_LENGTH;

  const search = () => {
    if (!canSearch) {
      return;
    }
    setResults(MOCK_RESULTS);
    // 검색어를 바꿔 다시 찾으면 앞서 고른 것이 남아 있으면 안 된다
    setSelected(null);
  };

  // 시안은 검색어만 넣어도 `입력 완료`를 활성으로 그렸지만, 주소를 고르지 않으면 넘길 값이 없다.
  // 골랐을 때만 활성으로 둔다 (#187).
  const submit = () => {
    if (!selected) {
      return;
    }
    // 우편번호도 함께 넘긴다. 배송지 화면은 도로명만 보여주지만(시안) 저장할 때 둘 다 필요하다 —
    // 백엔드가 `zipNo → zipCode`, `roadAddr → address`로 받기로 했다 (2026-09-15 회신).
    const query = new URLSearchParams({ zipNo: selected.zipNo, roadAddr: selected.roadAddr });
    router.push(`/mypage/address/new?${query}`);
  };

  return (
    <SingleInputScreen question="주소를 입력해주세요" submitDisabled={!selected} onSubmit={submit}>
      {/* 시안은 테두리 상자가 아니라 밑줄 한 줄이고 검색 버튼이 그 줄 안에 들어간다 */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <label htmlFor="address-keyword" className="sr-only">
          주소 검색어
        </label>
        <Input
          id="address-keyword"
          value={keyword}
          placeholder="예) 테헤란로 123"
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && search()}
          className="h-7 flex-1 border-0 px-0 text-body-medium-16 shadow-none placeholder:text-text-body-tertiary focus-visible:ring-0"
        />
        {/* 시안 button/s — 28px에 label/bold_14. 비활성은 흐려지지 않고 회색으로 채워진다 */}
        <Button
          disabled={!canSearch}
          onClick={search}
          className={cn(
            "h-7 shrink-0 rounded-lg px-3 text-label-bold-14",
            "disabled:bg-surface-disable disabled:text-text-label-disable disabled:opacity-100",
          )}
        >
          검색
        </Button>
      </div>

      {/* 어떻게 찾아야 하는지 알려주는 예시. 검색 전에만 보인다 (mypa_312_입력전) */}
      {results === null && (
        <dl className="flex flex-col gap-5">
          {SEARCH_EXAMPLES.map((item) => (
            <div key={item.label} className="flex gap-2">
              <dt className="shrink-0 text-label-bold-14 text-foreground">{item.label}</dt>
              <dd className="text-body-regular-14 text-text-body-tertiary">{item.example}</dd>
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
