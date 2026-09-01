// 주소 결과 목록 테스트. 항목 표시와 선택 전달을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { AddressResultList, type AddressResult } from "./address-result-list";

const RESULTS: AddressResult[] = [
  {
    zipNo: "06133",
    roadAddr: "서울특별시 강남구 테헤란로 123 (역삼동)",
    jibunAddr: "서울특별시 강남구 역삼동 848-23 아남빌딩",
    bdNm: "아남빌딩",
  },
];

test("우편번호·도로명·구주소를 항목 이름과 함께 보여준다", () => {
  render(<AddressResultList results={RESULTS} onSelect={() => {}} />);

  // 값만 나열하면 어느 주소 형식인지 알 수 없어 시안(mypa_312_검색결과)이 이름을 붙였다
  for (const term of ["우편번호", "도로명", "구주소"]) {
    expect(screen.getByText(term)).toBeDefined();
  }
  expect(screen.getByText("06133")).toBeDefined();
  expect(screen.getByText("서울특별시 강남구 테헤란로 123 (역삼동)")).toBeDefined();
  expect(screen.getByText("서울특별시 강남구 역삼동 848-23 아남빌딩")).toBeDefined();
});

test("건물명은 따로 보여주지 않는다", () => {
  render(<AddressResultList results={RESULTS} onSelect={() => {}} />);

  // 도로명 주소에 이미 들어 있어 시안도 줄을 나누지 않는다
  expect(screen.queryByText("건물명")).toBeNull();
});

test("고르면 선택한 항목을 넘긴다", () => {
  const onSelect = vi.fn();
  render(<AddressResultList results={RESULTS} onSelect={onSelect} />);

  fireEvent.click(screen.getAllByRole("button")[0]);
  expect(onSelect).toHaveBeenCalledWith(RESULTS[0]);
});
