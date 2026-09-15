// 배송지 화면 테스트. 주소창이 가리키는 곳에 맞는 값이 채워지는지 본다.
//
// 대상이 바뀌는 경우(집 → 회사)는 여기서 확인하지 못한다.
// NuqsTestingAdapter가 searchParams를 처음 한 번만 읽어, 다시 렌더해도 값이 바뀌지 않는다.
// 그 경우는 화면 쪽에서 key로 폼을 새로 세워 막는다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { EditAddressView } from "./edit-address-view";

function renderAt(search: string) {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <EditAddressView />
    </NuqsTestingAdapter>,
  );
  return screen.getByLabelText("배송지 이름") as HTMLInputElement;
}

test("새 배송지는 빈 칸으로 시작한다", () => {
  const input = renderAt("");

  expect(screen.getByRole("heading", { name: "어디로 보내드릴까요?" })).toBeDefined();
  expect(input.value).toBe("");
});

test("이미 저장된 곳을 열면 그 값이 채워진다", () => {
  const input = renderAt("?place=home");

  expect(screen.getByRole("heading", { name: "집 주소를 고칠까요?" })).toBeDefined();
  expect(input.value).toBe("집");
});

// 시안 mypa_311에 "연락처 추가" 메모가 붙었다. 기사가 부재 시 연락할 곳이다
test("저장된 곳을 열면 연락처도 함께 채워진다", () => {
  renderAt("?place=home");

  const phone = screen.getByLabelText("연락처") as HTMLInputElement;
  expect(phone.value).toBe("010-1234-5678");
});

// 다른 칸이 함께 비어 있으면 연락처 조건을 지워도 테스트가 통과해 회귀를 놓친다.
// 전부 채워진 곳에서 연락처만 비워야 그 조건 하나를 겨눌 수 있다
test("다 채워진 배송지에서 연락처만 비우면 입력 완료가 꺼진다", () => {
  renderAt("?place=home");

  const submit = screen.getByRole("button", { name: "입력 완료" });
  expect(submit.hasAttribute("disabled")).toBe(false);

  fireEvent.change(screen.getByLabelText("연락처"), { target: { value: "" } });

  expect(submit.hasAttribute("disabled")).toBe(true);
});

test("저장된 적 없는 곳이면 새 배송지로 다룬다", () => {
  const input = renderAt("?place=unknown");

  expect(screen.getByRole("heading", { name: "어디로 보내드릴까요?" })).toBeDefined();
  expect(input.value).toBe("");
});

// 검색 화면이 주소창에 실어 보낸 값이다. 이게 안 되면 주소를 골라도 폼이 비어 있다
test("검색 화면에서 고른 주소가 주소 줄에 들어온다", () => {
  renderAt(
    "?roadAddr=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C+%EA%B0%95%EB%82%A8%EA%B5%AC+%ED%85%8C%ED%97%A4%EB%9E%80%EB%A1%9C+123",
  );

  expect(screen.getByText("서울특별시 강남구 테헤란로 123")).toBeDefined();
  expect(screen.queryByText("주소 검색")).toBeNull();
});

// 고치러 들어와 새로 골랐으면 저장된 주소가 아니라 방금 고른 것이 보여야 한다
test("저장된 곳을 열어 새 주소를 고르면 그것이 저장된 값을 덮는다", () => {
  renderAt(
    "?place=home&roadAddr=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C+%EB%A7%88%ED%8F%AC%EA%B5%AC+%EC%96%91%ED%99%94%EB%A1%9C+45",
  );

  expect(screen.getByText("서울특별시 마포구 양화로 45")).toBeDefined();
  expect(screen.queryByText("서울특별시 강남구 테헤란로 123")).toBeNull();
});

// 주소를 고르지 않으면 넘길 값이 없다
test("주소가 비어 있으면 입력 완료가 꺼진다", () => {
  renderAt("");

  expect(screen.getByText("주소 검색")).toBeDefined();
  expect(screen.getByRole("button", { name: "입력 완료" }).hasAttribute("disabled")).toBe(true);
});
