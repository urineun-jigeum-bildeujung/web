// 결제 흐름 API 테스트. **`orderId`가 두 개인 것**을 여기서 고정한다.
import { afterEach, expect, test, vi } from "vitest";

import { createOrder, releaseOrder } from "./orders";
import { confirmPayment, preparePayment } from "./payment";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

// 응답을 잃고 다시 눌러도 주문이 두 건 생기면 안 된다. 서버가 이 키로 같은 요청을 알아본다
test("주문 생성은 받은 Idempotency-Key를 실어 보낸다", async () => {
  // **로컬 백엔드로 받아 본 실제 응답이다** (#322). orderId만 쓰지만 서버가 주는 것을
  // 그대로 적어 두어, 응답이 바뀌면 이 목이 먼저 어긋난다
  const fetchMock = stubFetch(
    {
      orderId: 1,
      orderNumber: "ORD-20260922-000001",
      orderStatus: "PENDING",
      productAmount: 48000,
      shippingFee: 3000,
      totalAmount: 51000,
      items: [
        {
          orderItemId: 1,
          productName: "오리&고구마 소형견 사료 1.5kg",
          quantity: 2,
          unitPrice: 24000,
        },
      ],
    },
    201,
  );

  const { orderId, shippingFee } = await createOrder(
    {
      addressId: 5,
      petId: 3,
      items: [{ productId: 12, quantity: 2 }],
    },
    "3b241101-e2bb-4255-8caf-4136c566a962",
  );

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain("/orders");
  expect(init.method).toBe("POST");
  // 서버가 필수로 받는다. 빠지면 본문 검증에서 400이다 (#393)
  expect(JSON.parse(String(init.body))).toMatchObject({ addressId: 5, petId: 3 });
  expect(new Headers(init.headers).get("Idempotency-Key")).toBe(
    "3b241101-e2bb-4255-8caf-4136c566a962",
  );
  expect(orderId).toBe(1);
  // 주문 상세 응답에는 이 필드가 없어 화면이 totalAmount - productAmount로 만든다.
  // 만드는 시점에는 서버가 직접 준다는 것을 여기 남겨 둔다 (#322)
  expect(shippingFee).toBe(3000);
});

// **키를 여기서 만들지 않는다.** 부를 때마다 새로 만들면 응답을 잃고 다시 보낸 요청을 서버가
// 못 알아봐 주문이 하나 더 생긴다. 키는 결제 화면이 본문의 지문과 함께 들고 준다 (#412)
test("주문 생성은 같은 키로 다시 부르면 같은 키를 싣는다", async () => {
  const fetchMock = stubFetch({ orderId: 1 }, 201);
  const request = { addressId: 5, petId: 3, items: [{ productId: 12, quantity: 1 }] };

  await createOrder(request, "key-1");
  await createOrder(request, "key-1");

  const keyOf = (i: number) =>
    new Headers(fetchMock.mock.calls[i][1].headers).get("Idempotency-Key");
  expect(keyOf(1)).toBe(keyOf(0));
});

/** 조회는 주문 상세를, 취소는 본문 없는 204를 돌려준다 */
function stubOrderRoutes(orderStatus: string) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>((url) =>
    Promise.resolve(
      url.endsWith("/cancel")
        ? new Response(null, { status: 204 })
        : Response.json({ orderId: 77, orderStatus }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// 새 주문을 만들 때 들고 있던 주문을 두면 결제 대기로 남아 재고 예약을 계속 쥔다 (#412)
test("밀려난 결제 대기 주문은 취소해 예약을 푼다", async () => {
  const fetchMock = stubOrderRoutes("PENDING");

  await releaseOrder(77);

  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toContain("/orders/77/cancel");
  expect(init.method).toBe("POST");
});

// **서버는 결제된 주문도 취소를 받는다.** 탭을 복제하면 저장소도 복제되어 다른 탭에서 결제한
// 주문을 들고 있을 수 있다 — 여기서 확인하지 않으면 결제된 주문이 취소된다 (#412)
test.each(["PAID", "CANCELLED"])("밀려난 주문이 %s면 취소하지 않는다", async (orderStatus) => {
  const fetchMock = stubOrderRoutes(orderStatus);

  await releaseOrder(77);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toContain("/orders/77");
});

// 이 누름의 목적은 새 주문으로 결제하는 것이다. 예약을 못 풀었다고 결제까지 막지 않는다
test("밀려난 주문을 못 풀어도 던지지 않고 남기기만 한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
  );
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(releaseOrder(77)).resolves.toBeUndefined();
  expect(consoleError).toHaveBeenCalledWith("[checkout.releaseOrder]", "TypeError");
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
