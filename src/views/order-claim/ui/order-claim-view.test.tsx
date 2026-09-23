// 반품·교환 신청 테스트. 세 단계를 거치며 서버가 거는 조건을 화면이 먼저 막는지, 고르고 적은
// 것이 요청에 그대로 실리는지 본다. 서버 규칙은 로컬 백엔드 소스에서 확인한 것이다 (#327, #408).
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { getOrderDetail, createClaim, uploadImage, replace } = vi.hoisted(() => ({
  getOrderDetail: vi.fn(),
  createClaim: vi.fn(),
  uploadImage: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, back: vi.fn() }) }));

vi.mock("@/entities/order/api/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/orders")>()),
  getOrderDetail,
}));

// 모듈을 통째로 갈아끼우지 않는다. `CLAIM_TYPES` 같은 상수와 발급 함수가 함께 사라진다
vi.mock("@/entities/order/api/claims", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/order/api/claims")>()),
  createClaim,
}));

// S3까지 가지 않는다. 주문용 발급 함수를 넘겼는지는 인자로 본다
vi.mock("@/shared/api/upload-image", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/upload-image")>()),
  uploadImage,
}));

vi.mock("@/shared/lib/app-toast", () => ({
  toastAppSuccess: vi.fn(),
  toastAppError: vi.fn(),
}));

import { toastAppSuccess } from "@/shared/lib/app-toast";

import {
  issueOrderImageUpload,
  type OrderDetail,
  type OrderDetailItem,
  type OrderItemClaim,
} from "@/entities/order";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { OrderClaimView } from "./order-claim-view";

/**
 * 지금. **날짜만 멈춘다.** 수거 희망일 보기가 "내일·모레"라 날이 바뀌면 기대값이 달라진다.
 * 2026-09-23(수) 한국 오후 3시면 보기는 9/24(목)·9/25(금)이다.
 */
const NOW = new Date("2026-09-23T15:00:00+09:00");

/**
 * 배송완료 시각. **지금에서 거슬러 잡는다.**
 *
 * 반품·교환은 배송완료 뒤 7일까지만 받으므로, 고정 날짜로 박아 두면 그날이 지나는 순간
 * 테스트가 저절로 깨진다 (#374).
 */
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function makeItem(over: Partial<OrderDetailItem> = {}): OrderDetailItem {
  return {
    orderItemId: 11,
    thumbnailUrl: null,
    productName: "테스트 사료",
    quantity: 2,
    unitPrice: 20000,
    itemStatus: "PAID",
    cancelledQuantity: 0,
    returnedQuantity: 0,
    effectiveQuantity: 2,
    claims: [],
    ...over,
  };
}

function makeClaim(claimStatus: string): OrderItemClaim {
  return {
    claimId: 1,
    claimType: "RETURN",
    claimStatus,
    requestedAt: "2026-09-21T09:00:00Z",
    completedAt: claimStatus === "REJECTED" ? "2026-09-22T09:00:00Z" : null,
  };
}

function makeDetail(over: Partial<OrderDetail> = {}): OrderDetail {
  return {
    orderId: 1,
    orderNumber: "ORD-CLAIM-01",
    // 서버 `Order.isClaimableForReturn`이 배송완료 **그리고** 그로부터 7일 이내만 받는다
    orderStatus: "DELIVERED",
    deliveredAt: daysAgo(1),
    productAmount: 40000,
    totalAmount: 43000,
    items: [makeItem()],
    deliveryAddress: {
      receiver: "홍길동",
      receiverPhone: "010-1234-5678",
      zipCode: "06133",
      address: "서울특별시 강남구 테헤란로 123",
      addressDetail: "4층",
    },
    deliveryNote: null,
    payment: { paidAt: "2026-09-20T10:00:00+09:00", method: "토스페이먼츠 결제" },
    ...over,
  };
}

// **유형에 기본값을 두지 않는다.** `renderView(undefined)`가 기본값으로 되돌아가 유형 없는 경우를
// 시험하지 못한다 — JS 기본 매개변수는 `undefined`에도 적용된다
function renderView(type: string | undefined, search = "") {
  const updates: UrlUpdateEvent[] = [];
  render(
    // 단계가 주소에 쌓이고 읽히는 것까지 보려고 주소를 기억하게 한다
    <NuqsTestingAdapter
      searchParams={search}
      hasMemory
      onUrlUpdate={(update) => updates.push(update)}
    >
      <OrderClaimView orderId="1" type={type} />
    </NuqsTestingAdapter>,
    { wrapper: createQueryWrapper() },
  );
  return { updates };
}

/** ① 상품을 고르고 ②로 넘어간다 */
async function pickAndNext(label = "반품", name: RegExp = /테스트 사료/) {
  fireEvent.click(await screen.findByRole("checkbox", { name }));
  fireEvent.click(screen.getByRole("button", { name: `${label} 신청하기` }));
  await screen.findByRole("heading", { name: `${label}할 상품` });
}

/** ② 사유를 고르고 ③으로 넘어간다 */
async function reasonAndNext(reason = "단순 변심") {
  fireEvent.click(screen.getByRole("radio", { name: reason }));
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  await screen.findByRole("heading", { name: "수거 희망일" });
}

function pickDate(name = "9/24(목)") {
  const dates = screen.getByRole("radiogroup", { name: "수거 희망일" });
  fireEvent.click(within(dates).getByRole("radio", { name }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.clearAllMocks();
  // jsdom에는 createObjectURL이 없다. 사진 미리보기가 쓴다
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  getOrderDetail.mockResolvedValue(makeDetail());
  createClaim.mockResolvedValue({
    claimId: 5,
    claimType: "RETURN",
    claimStatus: "REQUESTED",
    requestedAt: "2026-09-23T09:00:00Z",
  });
  uploadImage.mockImplementation(async (file: File) => `https://cdn.test/orders/${file.name}`);
});

afterEach(() => {
  vi.useRealTimers();
});

test("첫 단계는 머리말이 주문 내역이고 버튼에 유형이 선다", async () => {
  renderView("exchange");

  expect(await screen.findByRole("checkbox", { name: /테스트 사료/ })).toBeDefined();
  expect(screen.getByRole("heading", { name: "주문 내역" })).toBeDefined();
  // 교환 빈 화면의 버튼이 시안에 "반품 신청하기"로 남아 있었다. PD 승인으로 고친 문구다
  expect(screen.getByRole("button", { name: "교환 신청하기" })).toBeDefined();
});

// 주문 상세 확인창이 유형을 실어 보내는데 주소를 손으로 치고 들어올 수 있다
test("유형 없이 들어오면 신청할 수 없다고 알린다", async () => {
  renderView(undefined);

  expect(await screen.findByText("신청 유형 없음")).toBeDefined();
  expect(screen.queryByRole("button", { name: /신청하기/ })).toBeNull();
});

// 서버 `Order.java`가 DELIVERED에만 신청을 받는다. 보내 보고 409를 받을 일이 아니다
test("배송완료가 아니면 신청 기간이 아니라고 알린다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ orderStatus: "SHIPPING" }));
  renderView("return");

  expect(await screen.findByText("신청 기간 지남")).toBeDefined();
  expect(screen.queryByRole("button", { name: /신청하기/ })).toBeNull();
});

/**
 * 서버가 품목 하나만 걸려도 요청 전체를 거절한다. 고르지 못하게 먼저 막는다.
 * 시안(3333:37052)대로 목록에서 빼지 않고 흐리게 남긴다 — 사라지면 왜 없는지 모른다 (#408).
 */
test("진행 중인 신청이 걸린 상품은 남아 있되 고를 수 없다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        makeItem({
          orderItemId: 11,
          productName: "신청 중인 사료",
          claims: [makeClaim("COLLECTING")],
        }),
        makeItem({ orderItemId: 12, productName: "고를 수 있는 간식" }),
      ],
    }),
  );
  renderView("return");

  const inProgress = await screen.findByRole("checkbox", { name: /신청 중인 사료/ });
  expect(inProgress.hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("checkbox", { name: /고를 수 있는 간식/ }).hasAttribute("disabled")).toBe(
    false,
  );
});

// 신청할 수 없는 상품까지 고르면 서버가 요청 전체를 거절한다 (장바구니의 전체선택과 같다)
test("전체선택은 고를 수 있는 상품만 고른다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({
      items: [
        makeItem({
          orderItemId: 11,
          productName: "신청 중인 사료",
          claims: [makeClaim("REQUESTED")],
        }),
        makeItem({ orderItemId: 12, productName: "고를 수 있는 간식" }),
      ],
    }),
  );
  renderView("return");

  fireEvent.click(await screen.findByRole("checkbox", { name: "전체선택" }));

  expect(
    screen.getByRole("checkbox", { name: /고를 수 있는 간식/ }).getAttribute("aria-checked"),
  ).toBe("true");
  expect(
    screen.getByRole("checkbox", { name: /신청 중인 사료/ }).getAttribute("aria-checked"),
  ).toBe("false");
  expect(screen.getByRole("checkbox", { name: "전체선택" }).getAttribute("aria-checked")).toBe(
    "true",
  );
});

test("모든 상품에 신청이 걸려 있으면 진행 중이라고 알린다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({ items: [makeItem({ claims: [makeClaim("REQUESTED")] })] }),
  );
  renderView("return");

  expect(await screen.findByText("신청 진행 중")).toBeDefined();
});

// 끝난 신청은 막지 않는다. `ClaimStatus.terminalStates()`가 COMPLETED·REJECTED 둘이다
test("끝난 신청이 있는 상품은 다시 고를 수 있다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({ items: [makeItem({ claims: [makeClaim("REJECTED")] })] }),
  );
  renderView("return");

  const checkbox = await screen.findByRole("checkbox", { name: /테스트 사료/ });
  expect(checkbox.hasAttribute("disabled")).toBe(false);
});

// 전부 취소·반품된 줄은 고를 수량이 없다. 남겨 두면 수량 1로 신청했다가 거절당한다
test("남은 수량이 없는 상품만 있으면 신청할 것이 없다고 알린다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({ items: [makeItem({ returnedQuantity: 2, effectiveQuantity: 0 })] }),
  );
  renderView("return");

  expect(await screen.findByText("신청 진행 중")).toBeDefined();
});

/**
 * 서버 `Order.isClaimableForReturn`이 `deliveredAt.plusDays(7).isAfter(now())`로 막는다.
 * 화면이 같이 막지 않으면 사유까지 다 적고 나서 거절당한다 (#374).
 */
test("배송완료 7일이 지나면 신청할 수 없다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ deliveredAt: daysAgo(8) }));
  renderView("return");

  expect(await screen.findByText("신청 기간 지남")).toBeDefined();
});

// 배송완료인데 시각이 없으면 언제부터 7일인지 알 수 없다. 받지 않는 쪽이 맞다
test("배송완료 시각이 없으면 신청할 수 없다", async () => {
  getOrderDetail.mockResolvedValue(makeDetail({ deliveredAt: null }));
  renderView("return");

  expect(await screen.findByText("신청 기간 지남")).toBeDefined();
});

test("단계마다 채워야 할 것을 채우기 전에는 넘어갈 수 없다", async () => {
  renderView("return");

  const toReason = await screen.findByRole("button", { name: "반품 신청하기" });
  expect(toReason.hasAttribute("disabled")).toBe(true);

  await pickAndNext();
  // 시안의 "필수"는 사유다. 사진·상세 사유는 선택이라 비워도 넘어간다
  const toPickup = screen.getByRole("button", { name: "다음" });
  expect(toPickup.hasAttribute("disabled")).toBe(true);

  await reasonAndNext();
  // 수거 희망일도 필수다. 날짜 없이 접수하면 기사님이 언제 갈지 모른다
  const submit = screen.getByRole("button", { name: "반품 신청 완료하기" });
  expect(submit.hasAttribute("disabled")).toBe(true);
  pickDate();
  expect(submit.hasAttribute("disabled")).toBe(false);
});

// 단계는 `history: push`다. replace면 ③에서 뒤로가기를 누를 때 신청을 통째로 떠난다
test("단계를 넘길 때마다 주소에 쌓아 뒤로가기로 돌아올 수 있다", async () => {
  const { updates } = renderView("return");

  await pickAndNext();
  await reasonAndNext();

  expect(updates.map((update) => [update.queryString, update.options.history])).toEqual([
    ["?step=reason", "push"],
    ["?step=pickup", "push"],
  ]);
});

// 스테퍼 상한이 남은 수량이다. 넘겨 보내면 서버가 CLAIM_ITEM_QUANTITY_EXCEEDED로 거절한다
test("수량은 남은 수량을 넘지 못한다", async () => {
  renderView("return");
  await pickAndNext();

  const plus = screen.getByRole("button", { name: "테스트 사료 반품 수량 하나 늘리기" });
  fireEvent.click(plus);

  expect(within(screen.getByRole("group", { name: "테스트 사료 반품 수량" })).getByText("2"));
  expect(plus.hasAttribute("disabled")).toBe(true);
});

/**
 * **주문 수량이 아니라 남은 수량이 상한이다.**
 *
 * 2개 산 상품을 1개 반품하면 서버는 1개까지만 받는데(`CreateClaimService`), 주문 수량으로
 * 상한을 잡으면 2개를 고를 수 있어 사유까지 다 적고 거절당한다 (#374).
 */
test("이미 반품한 몫은 상한에서 빠진다", async () => {
  getOrderDetail.mockResolvedValue(
    makeDetail({ items: [makeItem({ returnedQuantity: 1, effectiveQuantity: 1 })] }),
  );
  renderView("return");
  await pickAndNext();

  expect(
    screen
      .getByRole("button", { name: "테스트 사료 반품 수량 하나 늘리기" })
      .hasAttribute("disabled"),
  ).toBe(true);
});

/**
 * 서버가 받지 않는 사유 보기·수거 희망일·요청사항은 사유 글 하나에 묶여 나간다.
 * 백엔드가 필드를 늘리기 어려워(2026-09-23) 읽을 수 있는 줄로 싣는다 (#408).
 */
test("고른 상품·수량과 적은 것이 사유 글로 묶여 나가고 주문 상세로 돌아간다", async () => {
  renderView("return");

  await pickAndNext();
  fireEvent.click(screen.getByRole("button", { name: "테스트 사료 반품 수량 하나 늘리기" }));
  fireEvent.change(screen.getByRole("textbox", { name: "상세 사유" }), {
    target: { value: "  포장이 찢어져 있었어요  " },
  });
  await reasonAndNext("상품 파손 · 불량");
  pickDate("9/25(금)");
  fireEvent.change(screen.getByRole("textbox", { name: "수거 요청사항" }), {
    target: { value: "문 앞에 두었어요" },
  });
  fireEvent.click(screen.getByRole("button", { name: "반품 신청 완료하기" }));

  await waitFor(() => expect(createClaim).toHaveBeenCalled());
  expect(createClaim).toHaveBeenCalledWith(1, {
    claimType: "RETURN",
    // 고른 보기는 코드로 간다. 서버가 필수로 받는다 (백엔드 #141 · #417)
    reasonCode: "DAMAGED",
    reason: [
      "[상세 사유] 포장이 찢어져 있었어요",
      "[수거 희망일] 2026-09-25",
      "[수거 요청사항] 문 앞에 두었어요",
    ].join("\n"),
    items: [{ orderItemId: 11, quantity: 2 }],
  });
  expect(toastAppSuccess).toHaveBeenCalled();
  // 뒤로가기로 방금 접수한 화면에 돌아오면 두 번 보내게 된다
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/mypage/orders/1"));
});

// 사진은 접수할 때 주문용 주소로 올리고, 돌려받은 주소를 싣는다 (#408)
test("붙인 사진은 접수할 때 올려 그 주소를 함께 보낸다", async () => {
  renderView("return");
  await pickAndNext();

  const photo = new File(["x"], "broken.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByLabelText("첨부할 사진 고르기"), { target: { files: [photo] } });
  expect(screen.getByRole("img", { name: "첨부한 사진 1" })).toBeDefined();
  expect(screen.getByRole("button", { name: "사진 추가 (1/3)" })).toBeDefined();

  await reasonAndNext();
  pickDate();
  fireEvent.click(screen.getByRole("button", { name: "반품 신청 완료하기" }));

  await waitFor(() => expect(createClaim).toHaveBeenCalled());
  expect(uploadImage).toHaveBeenCalledWith(photo, issueOrderImageUpload);
  expect(createClaim.mock.calls[0][1].imageUrls).toEqual(["https://cdn.test/orders/broken.jpg"]);
});

// 빈 배열을 보내지 않는다. 사진이 없으면 필드째 뺀다
test("사진을 붙이지 않으면 사진 주소를 보내지 않는다", async () => {
  renderView("return");
  await pickAndNext();
  await reasonAndNext();
  pickDate();
  fireEvent.click(screen.getByRole("button", { name: "반품 신청 완료하기" }));

  await waitFor(() => expect(createClaim).toHaveBeenCalled());
  expect(uploadImage).not.toHaveBeenCalled();
  expect(createClaim.mock.calls[0][1]).not.toHaveProperty("imageUrls");
});

// 시안 4장까지 붙일 칸이 없다. 넘치게 골라도 앞의 셋만 받는다
test("사진은 세 장까지만 붙는다", async () => {
  renderView("return");
  await pickAndNext();

  const photos = ["a", "b", "c", "d"].map(
    (name) => new File([name], `${name}.jpg`, { type: "image/jpeg" }),
  );
  fireEvent.change(screen.getByLabelText("첨부할 사진 고르기"), { target: { files: photos } });

  expect(screen.getAllByRole("img", { name: /첨부한 사진/ })).toHaveLength(3);
  // 다 채우면 더할 칸을 없앤다
  expect(screen.queryByRole("button", { name: /사진 추가/ })).toBeNull();
});

// 시안 mypa_361 — 개당 금액 × 신청 수량에서 반품비 3,000원을 뺀다
test("반품은 환불 예상 금액을 보인다", async () => {
  renderView("return");
  await pickAndNext();
  await reasonAndNext();

  expect(screen.getByRole("heading", { name: "환불 안내" })).toBeDefined();
  expect(screen.getByText("-3,000원")).toBeDefined();
  // 환불 예상 금액과 환불 수단 옆에 같은 금액이 선다
  expect(screen.getAllByText("17,000원")).toHaveLength(2);
  expect(screen.getByText("상태 확인이 끝나면 바로 환불해드릴게요.", { exact: false }));
});

// 교환은 환불이 없다. PD 답(2026-09-23)으로 옵션 줄이 빠지고 발송 안내만 남았다
test("교환은 환불 대신 교환 상품 안내를 보인다", async () => {
  renderView("exchange");
  await pickAndNext("교환");
  await reasonAndNext();

  expect(screen.getByRole("heading", { name: "교환 상품 안내" })).toBeDefined();
  expect(screen.getByText("수거 확인 후 3~5일 이내")).toBeDefined();
  expect(screen.queryByRole("heading", { name: "환불 안내" })).toBeNull();
  expect(screen.getByText("상태 확인이 끝나면 새 상품을 보내드릴게요.", { exact: false }));
  expect(screen.getByRole("button", { name: "교환 신청 완료하기" })).toBeDefined();
});

// 서버가 막는 세 가지(진행 중인 신청·수량 초과·기간 경과)는 접수를 눌러야 드러난다.
// 실패해도 적어 둔 것이 남아 다시 낼 수 있어야 한다 (#358).
test("접수가 실패하면 화면에 남고 성공을 알리지 않는다", async () => {
  createClaim.mockRejectedValue(new Error("CLAIM_ITEM_QUANTITY_EXCEEDED"));
  renderView("return");
  await pickAndNext();
  await reasonAndNext();
  pickDate();
  fireEvent.change(screen.getByRole("textbox", { name: "수거 요청사항" }), {
    target: { value: "문 앞에 두었어요" },
  });
  fireEvent.click(screen.getByRole("button", { name: "반품 신청 완료하기" }));

  await waitFor(() => expect(createClaim).toHaveBeenCalled());

  // 떠나지 않는다 — 떠나면 적어 둔 것이 사라진다
  expect(replace).not.toHaveBeenCalled();
  expect(toastAppSuccess).not.toHaveBeenCalled();
  expect((screen.getByRole("textbox", { name: "수거 요청사항" }) as HTMLInputElement).value).toBe(
    "문 앞에 두었어요",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "반품 신청 완료하기" }).hasAttribute("disabled"),
    ).toBe(false),
  );
});

// 입력값은 화면 상태라 새로고침하면 사라지는데 주소는 `?step=pickup`으로 남는다.
// 고른 것 없이 접수 버튼이 서면 안 된다. 되돌린 것이라 이력을 쌓지 않는다 (#408)
test("값 없이 뒤 단계 주소로 들어오면 첫 단계로 돌린다", async () => {
  const { updates } = renderView("return", "?step=pickup");

  expect(await screen.findByRole("checkbox", { name: "전체선택" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "반품 신청 완료하기" })).toBeNull();
  await waitFor(() => expect(updates.at(-1)?.options.history).toBe("replace"));
  expect(updates.at(-1)?.queryString).not.toContain("step=pickup");
});
