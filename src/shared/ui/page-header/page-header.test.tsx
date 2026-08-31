// 화면 머리말 단위 테스트. 기본 버튼 모양과 슬롯 대체를 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { PageHeader } from "./page-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

test("제목이 heading으로 렌더링된다", () => {
  render(<PageHeader title="재입고 알림" />);
  expect(screen.getByRole("heading", { level: 1, name: "재입고 알림" })).toBeDefined();
});

test("기본은 뒤로가기 버튼이고 읽을 수 있는 이름을 가진다", () => {
  render(<PageHeader title="배송지 관리" />);
  expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
});

test("leading이 close면 닫기 버튼이 된다", () => {
  render(<PageHeader leading="close" />);
  expect(screen.getByRole("button", { name: "닫기" })).toBeDefined();
});

test("leading이 none이면 왼쪽 버튼이 없다", () => {
  render(<PageHeader leading="none" title="온보딩" />);
  expect(screen.queryByRole("button")).toBeNull();
});

test("left를 넘기면 기본 버튼을 대체한다", () => {
  render(<PageHeader left={<button type="button">직접 넣은 버튼</button>} />);
  expect(screen.getByRole("button", { name: "직접 넣은 버튼" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "이전 화면으로" })).toBeNull();
});

test("onLeadingClick을 주면 그 함수가 불린다", () => {
  const onLeadingClick = vi.fn();
  render(<PageHeader onLeadingClick={onLeadingClick} />);

  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로" }));
  expect(onLeadingClick).toHaveBeenCalledOnce();
});

test("오른쪽 슬롯에 버튼이 여럿이어도 제목 자리가 흔들리지 않는다", () => {
  const { container } = render(
    <PageHeader
      title="마이페이지"
      right={
        <>
          <button type="button">장바구니</button>
          <button type="button">알림</button>
        </>
      }
    />,
  );

  // 좌우 열에 같은 유연 폭을 주는 3열 그리드여야 제목이 화면 중앙에 온다
  const header = container.querySelector("header");
  expect(header?.className).toContain("grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)]");
});
