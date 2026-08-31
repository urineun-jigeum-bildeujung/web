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

test("우편번호와 도로명·지번·건물명을 보여준다", () => {
  render(<AddressResultList results={RESULTS} onSelect={() => {}} />);

  expect(screen.getByText("06133")).toBeDefined();
  expect(screen.getByText("서울특별시 강남구 테헤란로 123 (역삼동)")).toBeDefined();
  expect(screen.getByText("서울특별시 강남구 역삼동 848-23 아남빌딩")).toBeDefined();
  expect(screen.getByText("아남빌딩")).toBeDefined();
});

test("건물명이 없으면 그 줄을 그리지 않는다", () => {
  render(<AddressResultList results={[{ ...RESULTS[0], bdNm: undefined }]} onSelect={() => {}} />);
  expect(screen.queryByText("건물명")).toBeNull();
});

test("고르면 선택한 항목을 넘긴다", () => {
  const onSelect = vi.fn();
  render(<AddressResultList results={RESULTS} onSelect={onSelect} />);

  fireEvent.click(screen.getAllByRole("button")[0]);
  expect(onSelect).toHaveBeenCalledWith(RESULTS[0]);
});
