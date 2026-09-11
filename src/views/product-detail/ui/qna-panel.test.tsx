// Q&A 탭 테스트. 답변 상태가 구분되는지, 문의 둘이 다른 곳으로 가는지 본다.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QnaPanel } from "./qna-panel";

describe("QnaPanel", () => {
  it("올라온 문의가 목록으로 보인다", () => {
    render(<QnaPanel />);

    // 같은 질문이 반복되는 것이 상품 문의의 성격이다. 묻기 전에 찾을 수 있어야 한다
    expect(screen.getByText("하루에 몇 알씩 급여하면 되나요?")).toBeDefined();
    expect(screen.getByText("보관은 어떻게 하면 되나요?")).toBeDefined();
  });

  it("답변을 기다리는 문의와 끝난 문의가 구분된다", () => {
    render(<QnaPanel />);

    expect(screen.getByText("답변대기")).toBeDefined();
    expect(screen.getAllByText("답변완료").length).toBeGreaterThan(1);
  });

  it("작성자는 가려진 채로 보인다", () => {
    render(<QnaPanel />);

    // 누가 물었는지는 가리고 무엇을 물었는지만 공개한다
    expect(screen.getByText(/구\*{5}/)).toBeDefined();
  });

  // 배송 문의는 주문 건에 매여 공개 목록에 쌓이지 않는다
  it("상품 문의와 배송 문의가 서로 다른 곳으로 간다", () => {
    render(<QnaPanel />);

    const product = screen.getByRole("link", { name: "상품 문의" });
    const delivery = screen.getByRole("link", { name: /배송 · 반품 · 교환 문의$/ });

    expect(product.getAttribute("href")).toBe("/mypage/support");
    expect(delivery.getAttribute("href")).toBe("/mypage/support/inquiries");
  });

  it("배송 문의 답변을 어디서 보는지 알려준다", () => {
    render(<QnaPanel />);

    expect(screen.getByRole("link", { name: /1:1문의에서 확인해 보세요/ })).toBeDefined();
  });
});
