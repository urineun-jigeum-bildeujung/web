// 결제 흐름 API 테스트. **`orderId`가 두 개인 것**을 여기서 고정한다.
import { afterEach, expect, test, vi } from "vitest";

import { createOrder } from "./orders";
import { confirmPayment, preparePayment } from "./payment";

afterEach(() => {
  vi.unstubAllGlobals();
});

// **Response는 한 번만 읽을 수 있다.** 같은 객체를 돌려주면 두 번째 호출이
// "Body has already been read"로 터진다. 부를 때마다 새로 만든다
function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(Response.json(body, { status })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// 결제 버튼을 연타하거나 재시도가 일어나도 주문이 두 건 생기면 안 된다
test("주문 생성은 Idempotency-Key를 실어 보낸다", async () => {
  const fetchMock = stubFetch({ orderId: 1 }, 201);

  const { orderId } = await createOrder({
    addressId: 5,
    items: [{ productId: 12, quantity: 2 }],
  });

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain("/orders");
  expect(init.method).toBe("POST");
  expect(new Headers(init.headers).get("Idempotency-Key")).toMatch(/[0-9a-f-]{36}/);
  expect(orderId).toBe(1);
});

// 같은 값을 두 번 부르면 서버가 같은 요청으로 못 알아본다
test("주문 생성은 부를 때마다 다른 Idempotency-Key를 쓴다", async () => {
  const fetchMock = stubFetch({ orderId: 1 }, 201);
  const request = { addressId: 5, items: [{ productId: 12, quantity: 1 }] };

  await createOrder(request);
  await createOrder(request);

  const keyOf = (i: number) =>
    new Headers(fetchMock.mock.calls[i][1].headers).get("Idempotency-Key");
  expect(keyOf(0)).not.toBe(keyOf(1));
});

// **결제 요청에는 숫자 PK가 간다.** 문자열 주문번호를 넣으면 서버가 주문을 못 찾는다
test("결제 요청은 주문의 숫자 PK를 보낸다", async () => {
  const fetchMock = stubFetch({
    tossOrderId: "ORD-20260918-000123",
    amount: 48000,
    orderName: "고양이 사료 외 1건",
    customerKey: "3f29a1d0",
  });

  const result = await preparePayment({ orderId: 1 });

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain("/payments");
  expect(JSON.parse(String(init.body))).toEqual({ orderId: 1 });
  // 위젯에 넘길 것은 문자열 주문번호다
  expect(result.tossOrderId).toBe("ORD-20260918-000123");
  expect(result.customerKey).toBe("3f29a1d0");
});

// **승인에는 문자열 주문번호가 간다.** 토스가 복귀 주소에 실어 보낸 그 값이다
test("승인은 토스가 돌려준 문자열 주문번호를 보낸다", async () => {
  const fetchMock = stubFetch({
    paymentId: 10,
    orderNumber: "ORD-20260918-000123",
    paymentStatus: "DONE",
    amount: 48000,
    method: "토스페이",
    approvedAt: "2026-09-18T15:04:05+09:00",
  });

  const result = await confirmPayment({
    paymentKey: "tviva20260918",
    orderId: "ORD-20260918-000123",
    amount: 48000,
  });

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain("/payments/confirm");
  expect(JSON.parse(String(init.body)).orderId).toBe("ORD-20260918-000123");
  expect(result.paymentStatus).toBe("DONE");
  expect(result.orderNumber).toBe("ORD-20260918-000123");
});
