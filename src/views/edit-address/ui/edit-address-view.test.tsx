// 배송지 화면 테스트. 주소창이 가리키는 곳에 맞는 값이 채워지는지 본다.
//
// 대상이 바뀌는 경우(집 → 회사)는 여기서 확인하지 못한다.
// NuqsTestingAdapter가 searchParams를 처음 한 번만 읽어, 다시 렌더해도 값이 바뀌지 않는다.
// 그 경우는 화면 쪽에서 key로 폼을 새로 세워 막는다.
import { render, screen } from "@testing-library/react";
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

test("저장된 적 없는 곳이면 새 배송지로 다룬다", () => {
  const input = renderAt("?place=unknown");

  expect(screen.getByRole("heading", { name: "어디로 보내드릴까요?" })).toBeDefined();
  expect(input.value).toBe("");
});
