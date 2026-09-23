// 주문 상세 테스트. 서버가 준 주문을 그리는지, 응답에 없어 계산해 만드는 값이 맞는지,
// 배송 전에만 주문을 취소하고 배송완료일 때만 반품·교환으로 갈 수 있는지 본다.
// 구성은 2026-09-23 시안(mypa_161, #405·#410)을 따른다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { getOrderDetail, cancelOrder } = vi.hoisted(() => ({
  getOrderDetail: vi.fn(),
  cancelOrder: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrderDetail,
  cancelOrder,
}));

import type { OrderDetail } from "@/entities/order";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { OrderDetailView } from "./order-detail-view";

/**
 * 배송완료 시각. **오늘에서 거슬러 잡는다.**
 *
 * 반품·교환은 배송완료 뒤 7일까지만 받으므로, 고정 날짜로 박아 두면 그날이 지나는 순간
 * 테스트가 저절로 깨진다 (#374).
 */
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** 명세 Example을 그대로 옮긴 값. 배송비는 없고 38,000 - 35,000이 그 자리다 */
function makeDetail(over: Partial<OrderDetail> = {}): OrderDetail {
  return {
    orderId: 1,
    orderNumber: "ORD-TEST-DETAIL-01",
    orderStatus: "PAID",
    deliveredAt: null,
    productAmount: 35000,
    totalAmount: 38000,
    items: [
      {
        orderItemId: 2,
        thumbnailUrl: null,
        productName: "테스트 상품 A",
        quantity: 1,
        unitPrice: 35000,
        itemStatus: "PAID",
        cancelledQuantity: 0,
        returnedQuantity: 0,
        effectiveQuantity: 1,
        claims: [],
      },
    ],
    deliveryAddress: {
      receiver: "홍길동",
      receiverPhone: "010-1234-5678",
      zipCode: "06133",
      address: "서울특별시 강남구 테헤란로 123",
      addressDetail: "UI타워 4층 404호",
    },
    deliveryNote: "문 앞에 놓아주세요.",
    payment: { paidAt: "2026-09-11T03:00:00.000Z", method: "토스페이먼츠 결제" },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getOrderDetail.mockResolvedValue(makeDetail());
});

/** 상품 한 줄의 글자 전부. 금액이 숫자와 "원"으로 갈려 있어 줄째 읽는다 */
function productRowText(name: string) {
  return screen.getByText(name).closest("li")?.textContent;
}

test("결제일·주문 상품·결제상세·배송지 정보를 나눠 보여준다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("heading", { name: "주문 내역", level: 1 })).toBeDefined();
  for (const title of ["주문 상품 1개", "결제상세", "배송지 정보"]) {
    expect(await screen.findByRole("heading", { name: title })).toBeDefined();
  }
  // 첫 카드는 제목 없이 결제일이 맨 윗줄이다. 결제 시각은 한국 기준으로 읽는다
  const summary = screen.getByRole("region", { name: "주문 정보" });
  expect(summary.textContent).toContain("결제일 26.09.11");
});

test("서버가 준 주문번호와 상품을 보여준다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("ORD-TEST-DETAIL-01")).toBeDefined();
  expect(productRowText("테스트 상품 A")).toBe("테스트 상품 A1개35,000원");
});

// 2026-09-23 시안에서 상세의 상태 뱃지가 빠졌다. 목록에만 붙는다
test("상태 뱃지를 붙이지 않는다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  await screen.findByText("ORD-TEST-DETAIL-01");
  expect(screen.queryByText("배송준비중")).toBeNull();
});

// 응답에 배송비 필드가 없다. 결제 금액에서 상품 금액을 빼 만드는 값이라 틀리면 바로 돈이 안 맞는다
test("배송비는 결제 금액에서 상품 금액을 뺀 값이다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("배송비")).toBeDefined();
  expect(screen.getByText("3,000원")).toBeDefined();
  expect(screen.getByText("38,000원")).toBeDefined();
  // 결제상세의 상품 금액. 상품이 하나뿐이라 상품 줄의 금액과 같다
  expect(screen.getByText("35,000원")).toBeDefined();
});

// 도로명과 상세 주소가 따로 온다. 하나만 그리면 몇 층 몇 호인지 사라진다
test("배송지는 도로명과 상세 주소를 함께 보여준다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByText("서울특별시 강남구 테헤란로 123 UI타워 4층 404호")).toBeDefined();
  expect(screen.getByText("010-1234-5678")).toBeDefined();
});

// 헷갈리는 정보를 물을 곳이다. 고객지원의 1:1 문의로 보낸다
test("1:1문의로 갈 수 있다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  const link = await screen.findByRole("link", { name: "1:1문의" });
  expect(link.getAttribute("href")).toBe("/mypage/support/inquiries");
});

// 시안(mypa_161)의 결제상세는 결제금액·상품 옵션·배송비·결제수단 넷뿐이다
test("시안에서 빠진 포인트 할인과 하단 링크를 보여주지 않는다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  await screen.findByText("ORD-TEST-DETAIL-01");
  expect(screen.queryByText("포인트 할인")).toBeNull();
  expect(screen.queryByRole("link", { name: "리뷰 작성" })).toBeNull();
  expect(screen.queryByRole("link", { name: "문의하기" })).toBeNull();
});

// 배송이 끝나야 반품·교환을 접수할 수 있다. 배송 전에는 주문 취소가 맞는 길이다
test("배송완료가 아니면 반품·교환 버튼이 없다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  await screen.findByText("ORD-TEST-DETAIL-01");
  expect(screen.queryByRole("button", { name: "반품 신청하기" })).toBeNull();
  expect(screen.queryByRole("button", { name: "교환 신청하기" })).toBeNull();
});

test("배송완료면 반품·교환을 접수할 수 있다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({ orderStatus: "DELIVERED", deliveredAt: daysAgo(1) }),
  );
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("button", { name: "반품 신청하기" })).toBeDefined();
  expect(screen.getByRole("button", { name: "교환 신청하기" })).toBeDefined();
});

// 눌러 봐야 신청 화면이 "신청 진행 중"으로 되돌려 보낸다 (#334).
// 신청 상태 뱃지는 2026-09-23 시안에 자리가 없어 걷었다 (#405)
test("진행 중인 신청이 걸린 상품뿐이면 반품·교환 버튼을 감춘다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      orderStatus: "DELIVERED",
      deliveredAt: daysAgo(1),
      items: [
        {
          orderItemId: 2,
          thumbnailUrl: null,
          productName: "테스트 상품 A",
          quantity: 1,
          unitPrice: 35000,
          itemStatus: "PAID",
          cancelledQuantity: 0,
          returnedQuantity: 0,
          effectiveQuantity: 1,
          claims: [
            {
              claimId: 1,
              claimType: "RETURN",
              claimStatus: "COLLECTING",
              requestedAt: "2026-09-21T09:00:00Z",
              completedAt: null,
            },
          ],
        },
      ],
    }),
  );
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  await screen.findByText("ORD-TEST-DETAIL-01");
  expect(screen.queryByRole("button", { name: "반품 신청하기" })).toBeNull();
  expect(screen.queryByText("반품 수거 중")).toBeNull();
});

// 거절·완료는 끝난 신청이다. 다시 신청할 수 있어야 한다
test("끝난 신청만 있으면 다시 신청할 수 있다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      orderStatus: "DELIVERED",
      deliveredAt: daysAgo(1),
      items: [
        {
          orderItemId: 2,
          thumbnailUrl: null,
          productName: "테스트 상품 A",
          quantity: 1,
          unitPrice: 35000,
          itemStatus: "PAID",
          cancelledQuantity: 0,
          returnedQuantity: 0,
          effectiveQuantity: 1,
          claims: [
            {
              claimId: 1,
              claimType: "RETURN",
              claimStatus: "REJECTED",
              requestedAt: "2026-09-20T09:00:00Z",
              completedAt: "2026-09-21T09:00:00Z",
            },
          ],
        },
      ],
    }),
  );
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("button", { name: "반품 신청하기" })).toBeDefined();
});

// 확인창에서 바로 접수되면 사유도 사진도 받지 못한다. 신청 화면으로 넘겨야 한다 (MYPA_261)
test("반품을 확인하면 그 주문의 신청 화면으로 간다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({ orderId: 7, orderStatus: "DELIVERED", deliveredAt: daysAgo(1) }),
  );
  render(<OrderDetailView orderId="7" />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "반품 신청하기" }));
  expect(screen.getByText("반품 접수를 진행할까요?")).toBeDefined();
  // 시안은 트리거와 확인 버튼을 같은 문구로 쓴다. 확인 쪽만 링크다
  const link = screen.getByRole("link", { name: "반품 신청하기" });
  expect(link.getAttribute("href")).toBe("/mypage/orders/7/claim?type=return");
});

// 상세는 무엇을 샀는지 다 보여야 한다
test("상품이 여럿이면 모두 보여주고 줄마다 낸 돈을 적는다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        {
          orderItemId: 2,
          thumbnailUrl: null,
          productName: "사료",
          quantity: 2,
          unitPrice: 10000,
          itemStatus: "PAID",
          cancelledQuantity: 0,
          returnedQuantity: 0,
          effectiveQuantity: 2,
          claims: [],
        },
        {
          orderItemId: 3,
          thumbnailUrl: null,
          productName: "간식",
          quantity: 1,
          unitPrice: 15000,
          itemStatus: "PAID",
          cancelledQuantity: 0,
          returnedQuantity: 0,
          effectiveQuantity: 1,
          claims: [],
        },
      ],
    }),
  );
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("heading", { name: "주문 상품 2개" })).toBeDefined();
  // 낱개 값에 수량을 곱한 것이 그 줄에 낸 돈이다
  expect(productRowText("사료")).toBe("사료2개20,000원");
  expect(productRowText("간식")).toBe("간식1개15,000원");
});

// 주문은 결제 전에도 만들어진다. 그때 `payment`가 null로 오는데 빈 카드를 세우면
// 결제가 끝난 것처럼 보인다 (백엔드 `OrderDetailResponse.from`)
test("결제 전 주문이면 결제상세 카드를 세우지 않는다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ orderStatus: "PENDING", payment: null }));
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("heading", { name: "주문 상품 1개" })).toBeDefined();
  expect(screen.queryByRole("heading", { name: "결제상세" })).toBeNull();
  // 결제일도 지어내지 않는다
  expect(screen.getByRole("region", { name: "주문 정보" }).textContent).not.toContain("결제일");
  // 배송지는 결제와 무관하게 정해져 있어 그대로 보인다
  expect(screen.getByRole("heading", { name: "배송지 정보" })).toBeDefined();
});

test("조회가 실패하면 토스트 대신 화면에서 알린다", async () => {
  getOrderDetail.mockRejectedValue(new Error("network down"));
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  expect(await screen.findByRole("alert")).toBeDefined();
});

// `/mypage/orders/abc`로도 들어올 수 있다. 400을 받으러 한 번 다녀올 이유가 없다
test("주문 번호가 숫자가 아니면 서버를 부르지 않는다", async () => {
  render(<OrderDetailView orderId="abc" />, { wrapper: createQueryWrapper() });

  // 서버 404(`ORDER_404_ORDER_NOT_FOUND`)와 같은 문구다. 갈리면 같은 화면이 두 말을 한다 (#426)
  expect(await screen.findByText("주문 없음")).toBeDefined();
  await waitFor(() => expect(getOrderDetail).not.toHaveBeenCalled());
});

/**
 * **받아 둔 주문이 있으면 오류 화면으로 덮지 않는다.** 다시 받기가 실패해도 v5는 받아 둔 것을
 * 남긴 채 오류를 채워, 오류 화면 아래에 옛 주문과 그 버튼이 함께 그려졌다. 목록과 같다 (#426)
 */
test("다시 받기가 실패해도 받아 둔 주문을 오류 화면으로 덮지 않는다", async () => {
  cancelOrder.mockImplementation(async () => {
    // 취소는 됐는데 다시 받기가 실패한다
    getOrderDetail.mockRejectedValue(new Error("server down"));
  });
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소하기" }));
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));

  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(1));
  await waitFor(() => expect(getOrderDetail).toHaveBeenCalledTimes(2));
  expect(screen.getByText("ORD-TEST-DETAIL-01")).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

// 서버는 주문 전체만 취소한다. PD가 취소를 목록의 상품마다가 아니라 주문 전체가 보이는
// 상세 맨 아래로 옮겼다(mypa_161_준비중_주문상세 3324:37275, #410)
test("배송 전 주문이면 맨 아래 주문 취소하기로 확인을 거쳐 주문을 취소한다", async () => {
  cancelOrder.mockImplementation(async () => {
    // 취소가 끝나면 다시 받은 상세는 취소된 주문이다
    getOrderDetail.mockResolvedValue(makeDetail({ orderStatus: "CANCELLED" }));
  });
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소하기" }));
  expect(screen.getByText("주문을 취소할까요?")).toBeDefined();
  // 모달이 열리면 뒤의 버튼은 가려져 모달 안의 확인 버튼만 잡힌다
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));

  await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(1));
  // 취소된 주문에는 다시 취소할 길이 없다
  await waitFor(() => expect(screen.queryByRole("button", { name: "주문 취소하기" })).toBeNull());
});

// 서버 전이 규칙이 `PAID`·`PREPARING`에서만 취소를 받는다. 배송이 시작되면 눌러 봐야 409다
test.each(["SHIPPING", "DELIVERED", "CONFIRMED"])(
  "%s 주문에는 주문 취소하기가 없다",
  async (orderStatus) => {
    getOrderDetail.mockResolvedValue(makeDetail({ orderStatus, deliveredAt: daysAgo(1) }));
    render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

    expect(await screen.findByText("ORD-TEST-DETAIL-01")).toBeDefined();
    expect(screen.queryByRole("button", { name: "주문 취소하기" })).toBeNull();
  },
);

// 시안은 되돌릴 수 없는 취소를 빨간 버튼으로 둔다. 확인창 기본 버튼(`AlertDialogAction`)에
// 빨간 바탕을 얹었더니 진한 바탕 클래스가 함께 남아 진한 색으로 그려졌다 (#405)
test("주문 취소 확인 버튼은 빨간 바탕 하나만 쓴다", async () => {
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소하기" }));
  const confirm = screen.getByRole("button", { name: "주문 취소하기" });
  expect(confirm.className).toContain("bg-destructive");
  expect(confirm.className).not.toContain("bg-primary");
});

// 보내는 중에 모달이 닫히면 요청만 남아 끝났을 때 취소됐는지 알 수 없다 (#293 리뷰)
test("취소를 보내는 동안에는 모달을 닫을 수 없다", async () => {
  cancelOrder.mockImplementation(() => new Promise(() => {}));
  render(<OrderDetailView orderId="1" />, { wrapper: createQueryWrapper() });

  fireEvent.click(await screen.findByRole("button", { name: "주문 취소하기" }));
  fireEvent.click(screen.getByRole("button", { name: "주문 취소하기" }));
  await waitFor(() => expect(cancelOrder).toHaveBeenCalled());

  fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
  expect(screen.getByText("주문을 취소할까요?")).toBeDefined();
  expect(screen.getByRole("button", { name: "닫기" }).hasAttribute("disabled")).toBe(true);
});
