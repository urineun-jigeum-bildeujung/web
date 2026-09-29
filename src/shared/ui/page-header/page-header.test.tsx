// 화면 머리말 단위 테스트. 기본 버튼 모양과 슬롯 대체를 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { PageHeader } from "./page-header";

const { back, push } = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

test("제목이 heading으로 렌더링된다", () => {
  render(<PageHeader title="재입고 알림" />);
  expect(screen.getByRole("heading", { level: 1, name: "재입고 알림" })).toBeDefined();
});

test("기본은 뒤로가기 버튼이고 읽을 수 있는 이름을 가진다", () => {
  render(<PageHeader title="배송지 관리" />);
  expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
});

// 시안 공용 header(3581:82062): 누르는 자리 48×48이 왼쪽 여백에서 시작하고 32px 화살표가 그 왼쪽에 붙는다.
// 44px 가운데 24px이던 때는 화살표가 작고 7px 오른쪽으로 밀려 화면마다 달라 보였다(#513)
test("뒤로가기 화살표는 시안 크기(32px)로 누르는 자리 왼쪽에 붙는다", () => {
  render(<PageHeader title="배송지 관리" />);

  const button = screen.getByRole("button", { name: "이전 화면으로" });
  expect(button.className).toContain("size-12");
  expect(button.className).toContain("justify-start");
  expect(button.querySelector("svg")?.getAttribute("class")).toContain("size-8");
});

// 홈과 마이페이지가 로고를 각자 그려 색과 여백이 달랐다(#513)
test("leading이 logo면 버튼 없이 서비스 이름을 둔다", () => {
  render(<PageHeader leading="logo" />);

  expect(screen.getByText("골라주개냥")).toBeDefined();
  expect(screen.queryByRole("button")).toBeNull();
});

// 다이얼로그는 제목이 다이얼로그 이름이어야 해서 DialogTitle을 그대로 받는다
test("제목에 요소를 넘기면 h1로 감싸지 않고 그대로 둔다", () => {
  render(<PageHeader title={<h2>사진 리뷰</h2>} />);

  expect(screen.getByRole("heading", { level: 2, name: "사진 리뷰" })).toBeDefined();
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
});

// 공유 링크·새 탭으로 바로 들어오면 되돌릴 기록이 없다(QA PD-004.1, #522)
test("되돌릴 기록이 없으면 뒤로가기가 홈으로 가고, 있으면 이전 화면으로 간다", () => {
  const length = vi.spyOn(window.history, "length", "get").mockReturnValue(1);
  render(<PageHeader title="상품 상세" />);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로" }));
  expect(push).toHaveBeenCalledWith("/");
  expect(back).not.toHaveBeenCalled();

  length.mockReturnValue(3);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로" }));
  expect(back).toHaveBeenCalledOnce();
  length.mockRestore();
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
  expect(header?.className).toContain("grid-cols-[minmax(3rem,1fr)_auto_minmax(3rem,1fr)]");
});

test("제목이 없어도 오른쪽 슬롯이 오른쪽 칸에 남는다", () => {
  const { container } = render(
    <PageHeader leading="none" right={<button type="button">장바구니</button>} />,
  );

  // 가운데 칸 자리를 비워 두지 않으면 오른쪽 슬롯이 가운데로 올라온다
  const header = container.querySelector("header");
  expect(header?.children).toHaveLength(3);
  expect(header?.children[1].className).not.toContain("sr-only");
});
