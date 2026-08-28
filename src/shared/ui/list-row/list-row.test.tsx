// 목록 줄 단위 테스트. 이동용과 실행용이 각각 알맞은 역할로 렌더링되는지 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ListRowButton, ListRowLink } from "./list-row";

test("이동용은 링크로 렌더링된다", () => {
  render(<ListRowLink href="/mypage/orders" title="주문/배송 내역" />);

  const link = screen.getByRole("link", { name: /주문\/배송 내역/ });
  expect(link.getAttribute("href")).toBe("/mypage/orders");
});

test("보조 설명을 함께 보여준다", () => {
  render(<ListRowLink href="/mypage/reviews" title="나의 상품 후기" description="작성 가능 2건" />);

  expect(screen.getByText("작성 가능 2건")).toBeDefined();
});

test("실행용은 버튼으로 렌더링되고 눌리면 콜백이 불린다", () => {
  const onClick = vi.fn();
  render(<ListRowButton title="로그아웃" onClick={onClick} hideChevron />);

  fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));
  expect(onClick).toHaveBeenCalledOnce();
});

test("disabled면 눌리지 않는다", () => {
  const onClick = vi.fn();
  render(<ListRowButton title="로그아웃" onClick={onClick} disabled />);

  fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));
  expect(onClick).not.toHaveBeenCalled();
});
