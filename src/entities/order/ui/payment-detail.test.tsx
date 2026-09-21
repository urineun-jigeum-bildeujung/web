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

// 주문을 못 받아 온 자리에서는 결제 금액만 알고 그 안을 가를 수 없다 (#308 리뷰)
test("세부 항목이 없으면 그 줄을 만들지 않는다", () => {
  const { container, queryByText } = render(<PaymentDetail total={38000} />);

  expect(queryByText("상품 옵션")).toBeNull();
  expect(queryByText("배송비")).toBeNull();
  expect(container.querySelectorAll("dt")).toHaveLength(2);
});
