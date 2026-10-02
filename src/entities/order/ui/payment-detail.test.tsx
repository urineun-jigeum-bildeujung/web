// 결제상세 테스트. `<dl>` 구조가 규칙을 지키는지, 세부 항목이 없을 때 자리를 만들지 않는지 본다.
import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import { PaymentDetail } from "./payment-detail";

/**
 * **`<dl>`의 자식 `<div>`는 `dt`·`dd`만 담을 수 있다.**
 *
 * 간격을 주려고 한 겹 더 감싸면 그 안의 `dt`·`dd`가 `dl` 소속으로 읽히지 않아, 스크린
 * 리더가 이름과 값을 짝으로 읽지 못한다. Lighthouse 접근성이 `definition-list`와
 * `dlitem` 둘로 잡고 `/payment`가 92점까지 내려갔었다 (#341).
 */
test("dl 아래에 이름·값 짝만 온다", () => {
  const { container } = render(
    <PaymentDetail total={38000} itemPrice={35000} shippingFee={3000} />,
  );

  const list = container.querySelector("dl");
  expect(list).not.toBeNull();

  for (const child of [...list!.children]) {
    // 자식은 짝을 감싼 div이거나 dt·dd 자신이다
    if (child.tagName === "DT" || child.tagName === "DD") {
      continue;
    }
    expect(child.tagName, `dl의 자식이 ${child.tagName}다`).toBe("DIV");
    expect(child.querySelector("dt"), "짝 안에 dt가 없다").not.toBeNull();
    expect(child.querySelector("dd"), "짝 안에 dd가 없다").not.toBeNull();
    // 한 겹 더 감싸면 안 된다
    expect(child.querySelector("div"), "짝 안에 div가 또 있다").toBeNull();
  }

  // dt·dd가 전부 dl 아래에 있다
  for (const item of container.querySelectorAll("dt, dd")) {
    expect(item.closest("dl"), "dl 밖에 있는 dt·dd가 있다").toBe(list);
  }
});

// 두 화면이 함께 쓰지만 시안이 다르다. 한쪽을 고치다 다른 쪽이 따라 바뀌지 않게 둘 다 본다 (#439)
// 주문 상세 시안은 "상품 옵션"이었는데 QA가 판매 금액이어야 한다고 했다(QA No.288, #655)
test("주문 상세도 판매 금액과 배송비를 그린다", () => {
  const { getByText, queryByText } = render(
    <PaymentDetail total={38000} itemPrice={35000} shippingFee={3000} />,
  );

  expect(getByText("판매 금액")).toBeDefined();
  expect(getByText("배송비")).toBeDefined();
  expect(getByText("3,000원")).toBeDefined();
  expect(queryByText("상품 옵션")).toBeNull();
});

// 로고만 있던 자리다. 이름을 글자로 적고 로고는 꾸밈으로 둬 두 번 읽히지 않는다(QA No.288, #655)
test("결제수단은 로고 옆에 Toss Pay를 글자로 적는다", () => {
  const { getByText, queryByRole } = render(<PaymentDetail total={38000} />);

  expect(getByText("Toss Pay")).toBeDefined();
  expect(queryByRole("img", { name: "토스페이" })).toBeNull();
});

// 주문 완료 시안에는 배송비 줄이 없지만 PD팀이 넣기로 했다. 없으면 결제금액과 판매 금액이
// 배송비만큼 달라 보인다 (2026-09-28, #448)
test("주문 완료는 판매 금액과 배송비를 그린다", () => {
  const { getByText, queryByText } = render(
    <PaymentDetail variant="complete" total={38000} itemPrice={35000} shippingFee={3000} />,
  );

  expect(getByText("판매 금액")).toBeDefined();
  expect(getByText("35,000원")).toBeDefined();
  expect(getByText("배송비")).toBeDefined();
  expect(getByText("3,000원")).toBeDefined();
  expect(queryByText("상품 옵션")).toBeNull();
});

// 주문을 못 받아 온 자리에서는 결제 금액만 알고 그 안을 가를 수 없다 (#308 리뷰)
test("세부 항목이 없으면 그 줄을 만들지 않는다", () => {
  const { container, queryByText } = render(<PaymentDetail total={38000} />);

  expect(queryByText("상품 옵션")).toBeNull();
  expect(queryByText("배송비")).toBeNull();
  expect(container.querySelectorAll("dt")).toHaveLength(2);
});
