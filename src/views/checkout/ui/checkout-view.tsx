// 결제하기. 어디로 보낼지, 무엇을 얼마에 사는지, 어떻게 낼지를 한 화면에서 확인한다.
// UI 시안 기준(paym_001 421:16488, paym_001_드롭다운, paym_001_직접입력)이다.
//
// **결제 방법 자리는 시안이 라디오 5종과 페이 로고 3종을 그렸지만 그리지 않는다.**
// 그 자리는 토스 결제위젯이 차지한다 (#212). 섹션 제목과 여백만 시안에 맞춘다.
//
// **승인은 시크릿 키를 쥔 백엔드가 맡는다** — 우리는 결제창을 띄우는 데까지다.
//
// **배송지는 기본 배송지를 쓴다.** 회원가입·온보딩 어디에도 배송지를 입력받는 화면이 없고,
// 시안이 `paym_011`에 `기본 배송지` 뱃지만 두고 "이 주소로 배송" 같은 확정 버튼을 그리지
// 않았다. 없을 때는 `empty_dilivery 2`(2022:157931)대로 등록하러 보낸다 (#255).
//
// **결제할 줄은 장바구니에서 고른 것이다.** `?items=NORMAL:1,TIME_DEAL:3`으로 받고,
// 없으면 살 수 있는 줄 전부를 본다 — 주소창으로 바로 들어와도 화면이 성립해야 한다.
//
// **주문에는 기본 아이를 싣는다.** 서버가 `petId`를 필수로 받는데, 여러 아이 중 고르는 자리는
// 시안에 없다. 대표 아이를 둘지 정해지기 전까지 기본 아이로 간다 (#393).

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useQueryAddresses } from "@/entities/address";
import { cartItemKey, useQueryCart, type CartItem } from "@/entities/cart";
import { OrderProductThumbnail } from "@/entities/order";
import { useQueryPets } from "@/entities/pet";
import { ApiError } from "@/shared/api/client";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Label } from "@/shared/ui/label";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";

import { createOrder, releaseOrder } from "../api/orders";
import { preparePayment } from "../api/payment";
import { ITEMS_PARAM, pickOrderItems, toOrderItem } from "../model/order-items";
import {
  clearPendingOrder,
  newPendingOrder,
  readPendingOrder,
  writePendingOrder,
} from "../model/pending-order";
import { toCheckoutPath } from "../model/return-query";
import { FieldRow } from "./field-row";
import { TossPaymentWidget, type TossPaymentOrder } from "./toss-payment-widget";

/** 장바구니 응답에 `deliveryFee`가 없어 고정값을 쓴다. 장바구니 화면과 같은 값이다 (#214) */
const SHIPPING_FEE = 3000;

/** 시안(paym_001_드롭다운) 순서 그대로다. 마지막 하나만 성격이 달라 값으로 가른다 */
const REQUEST_DIRECT = "직접 입력";

const REQUEST_OPTIONS = [
  "문 앞에 놓아주세요",
  "경비실에 맡겨주세요",
  "부재 시 전화 부탁드려요",
  "배송 전 미리 연락 주세요",
  "직접 받을게요",
  REQUEST_DIRECT,
];

/** 직접 입력 칸의 길이 제한. 시안이 `0/100자`로 세어 보인다 */
const REQUEST_MAX = 100;

/**
 * 결제 전 받아야 하는 동의.
 *
 * 필수 셋을 다 켜야 결제할 수 있다. 결제는 되돌릴 수 없는 동작이라, 동의 없이
 * 버튼이 눌리면 사용자가 무엇에 동의했는지 모르는 채로 돈이 나간다.
 */
const TERMS = [
  { id: "order", label: "주문 상품 정보 동의", required: true },
  { id: "privacy", label: "개인정보 제3자 제공 동의", required: true },
  { id: "pg", label: "결제 대행 서비스(PG) 이용 약관 동의", required: true },
  { id: "save", label: "다음 주문을 위해 이 결제 수단 저장", required: false },
] as const;

/** 시안의 약관 줄은 32px이다. 원의 누르는 자리는 44px로 넓혀져 있어 그대로 둔다 */
const TERM_ROW = "min-h-8";
const TERM_LABEL = "text-label-medium-14 text-surface-primary";

/** 위젯이 준비되면 넘겨주는 함수. 주문번호는 그때 손에 들어와 부를 때 넘긴다 */
type RequestPayment = (order: TossPaymentOrder) => Promise<void>;

/** 배송지 세 줄을 불러오는 동안 자리를 잡는다 */
function FieldRowsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-5 w-3/4" />
      ))}
    </div>
  );
}

/** 상품 한 줄을 불러오는 동안 자리를 잡는다. 실제 줄과 같은 크기다 */
function OrderItemSkeleton() {
  return (
    <div aria-hidden className="flex items-start gap-2">
      <Skeleton className="size-20 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

/** 주문할 상품 한 줄. 사진·이름·옵션·수량 (`paym_001`) */
function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-start gap-2">
      {/* 주문 화면들과 같은 80 썸네일이다. 사진이 없으면 자리만 잡는다 (#422) */}
      <OrderProductThumbnail imageUrl={item.thumbnailUrl} />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
        <div className="flex flex-col gap-1">
          {/* 살 수 있는 줄만 여기까지 오므로 이름이 `null`이 아니다 */}
          <p className="truncate text-title-bold-16 text-surface-primary">{item.productName}</p>
        </div>
        <dl>
          {/* 시안이 이 줄만 이름과 값을 16px 띄운다 */}
          <FieldRow term="주문 수량" description={`${item.quantity}개`} className="gap-4" />
        </dl>
      </div>
    </div>
  );
}

/** 섹션 하나. 시안이 제목과 내용을 12px로 띄우고 좌우를 20px로 잡는다 */
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 px-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-title-bold-18 text-surface-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * 서버가 이 주문으로는 결제할 수 없다고 한 코드들. `PaymentErrorCode`에서 옮겼다.
 *
 * **`RequestPaymentService`가 주문을 셋으로 거른다** — 못 찾거나, 남의 것이거나, `PENDING`이
 * 아니거나. 들고 있어 봐야 다음에도 같은 자리에서 막히므로 비워야 한다.
 */
const UNUSABLE_ORDER_CODES = new Set([
  "PAYMENT_404_ORDER_NOT_FOUND",
  "PAYMENT_403_ORDER_OWNER_MISMATCH",
  "PAYMENT_409_ORDER_NOT_PAYABLE",
]);

/**
 * 들고 있던 주문과 그 생성 키를 버려야 하는 실패인가.
 *
 * **주문을 만들다 막혔으면** 서버가 요청을 보고 거절했는지(4xx)를 본다. 같은 키로 다시 보내면
 * 서버가 그 키로 남긴 주문을 돌려주는데, 재고 부족처럼 저장한 뒤에 막힌 주문은 취소된 채 남아
 * 있다 — 다시 눌러도 그 취소된 주문이 온다. 5xx·네트워크 실패는 서버가 만들고 응답만 잃었을
 * 수 있어 그대로 든다 (#412).
 *
 * **만든 주문으로 결제를 준비하다 막혔으면** 서버가 준 코드를 본다. 상태 코드로 뭉뚱그리지
 * 않는다 — 429처럼 잠깐 막힌 것까지 버리면 다시 누를 때 주문이 하나 더 생긴다 (#361).
 */
/**
 * 결제를 시작하지 못한 까닭을 문구 코드로 옮긴다.
 *
 * **서버가 이유를 알려 준 실패는 그 문구를 쓴다.** 재고 부족·판매 중지·배송지 없음처럼 도메인
 * 문구가 있는데 "결제 실패 / 다시 시도해 주세요"로 뭉개면, 다시 눌러도 같은 자리에서 막힌다 (#422).
 * 상태 코드로 떨어진 공통 문구(`common.*`)는 결제 맥락이 빠져 있어 "결제 실패"로 모은다 —
 * 주문 완료 화면의 `toConfirmFailureCode`와 같은 방식이다.
 */
function toPayFailureCode(error: unknown): AppMessageCode {
  const code = toAppMessageCode(error);
  return code.startsWith("common.") ? APP_MESSAGE_CODE.payment.failed : code;
}

function shouldForgetOrder(error: unknown, creating: boolean): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  if (creating) {
    return error.status < 500;
  }
  return UNUSABLE_ORDER_CODES.has(error.problem?.errorCode ?? "");
}

export function CheckoutView() {
  const [request, setRequest] = useState(REQUEST_OPTIONS[0]);
  const [directRequest, setDirectRequest] = useState("");
  const [agreed, setAgreed] = useState<string[]>([]);
  // 위젯이 준비되면 결제창을 띄우는 함수를 준다. 준비 전에는 버튼을 잠근다
  const [requestPayment, setRequestPayment] = useState<RequestPayment | null>(null);
  // 주문 생성부터 결제창이 뜨기까지의 왕복. 결제는 되돌릴 수 없어 두 번 눌리면 안 된다
  const [paying, setPaying] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  // 결제창이 실패나 취소로 돌아오면 `?code=`가 붙는다. 왜 돌아왔는지 알려야 다시 시도한다.
  // **알린 뒤에는 주소에서 걷는다.** 두면 배송지 변경에 갔다 뒤로 오거나 새로고침할 때마다 같은
  // 실패가 또 뜬다. 고른 상품(`items`)만 남긴다 (#422)
  const failCode = searchParams.get("code");
  useEffect(() => {
    if (failCode) {
      toastAppError(APP_MESSAGE_CODE.payment.failed, failCode);
      router.replace(toCheckoutPath(searchParams.toString()), { scroll: false });
    }
  }, [failCode, router, searchParams]);

  const { cart, isLoading: cartLoading, error: cartError } = useQueryCart();
  const { addresses, isLoading: addressLoading, error: addressError } = useQueryAddresses();
  const { pets } = useQueryPets();

  // 기본 배송지가 없는 계정도 있다. 그때는 목록 맨 앞을 쓴다 — 조회가 기본을 앞으로 정렬한다
  const address = addresses?.find((place) => place.isDefault) ?? addresses?.[0];
  // 아이 조회도 기본 아이를 앞으로 정렬한다(`getPets`). 기본이 없으면 맨 앞 아이다
  const pet = pets?.[0];

  const items = pickOrderItems(cart?.items, searchParams.get(ITEMS_PARAM));
  const itemPrice = items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
  const total = itemPrice + SHIPPING_FEE;
  const deliveryNote = request === REQUEST_DIRECT ? directRequest.trim() : request;

  // **보내려는 주문 본문을 렌더 단계에서 만든다.** `pay` 안에서 만들면 지문과 실제 요청이
  // 갈릴 수 있고, React Compiler가 try 블록 안의 값 계산을 만나면 최적화를 포기한다 (#223)
  const orderRequest = {
    addressId: address ? address.addressId : null,
    // 지문에 들어가야 한다 — 아이가 바뀌었는데 옛 주문을 다시 쓰면 다른 아이 몫으로 남는다
    petId: pet ? Number(pet.id) : null,
    // 장바구니 규격(`itemType`+`itemId`)을 주문 규격으로 옮긴다. 서버가 상품과
    // 타임딜을 다른 필드로 받는다 (#306)
    items: items.map(toOrderItem),
    // 적지 않았으면 빈 문자열이 아니라 아예 보내지 않는다
    deliveryNote: deliveryNote || null,
  };
  // 만들어 둔 주문을 다시 쓸 수 있는지 가르는 값. **본문이 한 글자라도 다르면 쓰지 않는다** —
  // 배송지를 바꾸거나 요청사항을 고쳤는데 옛 주문으로 결제하면 엉뚱한 곳으로 간다.
  // **배송지는 id만이 아니라 내용까지 넣는다.** 서버는 주문을 만들 때 주소를 복사해 두고 바꾸지
  // 않아서, 같은 배송지의 주소를 고친 뒤 옛 주문을 쓰면 옛 주소로 간다 (#412)
  const orderSignature = JSON.stringify({ ...orderRequest, address });

  const requiredIds = TERMS.filter((term) => term.required).map((term) => term.id);
  const canPay =
    requiredIds.every((id) => agreed.includes(id)) &&
    requestPayment !== null &&
    address !== undefined &&
    // 아이를 모르는 채로 누르면 `petId` 없이 나가 400이다
    pet !== undefined &&
    items.length > 0 &&
    !paying;
  const allAgreed = TERMS.every((term) => agreed.includes(term.id));

  const toggle = (id: string, on: boolean) =>
    setAgreed((prev) => (on ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));

  /**
   * 주문을 만들고 결제창을 띄운다.
   *
   * ```
   * [1] POST /orders   → orderId(숫자 PK)
   * [2] POST /payments → tossOrderId(문자열)·orderName
   * [3] requestPayment
   * ```
   *
   * **`[1]`을 화면 진입 때 부를 수 없다.** 본문에 배송 요청사항이 들어가서 사용자가 고른 뒤라야
   * 하고, 미리 부르면 결제하지 않고 떠난 주문이 쌓인다. 그래서 버튼을 누른 이 자리에서 세
   * 단계를 잇는다 (#255).
   *
   * **`[1]`은 다시 눌러도 한 번만 만든다.** `[2]`·`[3]`에서 막힌 뒤 다시 누를 때 처음부터
   * 가면 `PENDING` 주문이 누를 때마다 하나씩 쌓이고, 그것들이 주문 내역에 "결제 대기" 줄로
   * 남는다. 한 번 사려던 것이 목록에 여러 줄로 보인다. 그래서 만든 주문을 들고 있다가 보내려는
   * 본문이 그대로면 `[2]`부터 다시 한다 (#361).
   *
   * 같은 주문으로 `[2]`를 다시 부르는 것은 서버가 받아 준다 — `RequestPaymentService`가
   * 중복 저장에서 기존 결제를 찾아 **같은 `tossOrderId`(주문번호)** 와 그 금액을 돌려준다.
   *
   * **`[1]`의 응답을 잃어도 한 번만 만든다.** 생성 키를 지문과 함께 들고 있다가, 같은 본문이면
   * 같은 키로 다시 묻는다. 서버가 이미 만든 주문을 돌려준다 (#412).
   *
   * **실패가 두 갈래라 여기서도 받아야 한다.** 결제창이 뜬 뒤의 실패·취소는 토스가 `failUrl`로
   * 되돌려 보내 `?code=`로 알 수 있지만, 창을 띄우기도 전에 막히면(주문 생성 실패, 파라미터
   * 오류 등) 리다이렉트가 일어나지 않고 약속만 깨진다. 놓치면 눌러도 아무 일이 없어 보인다.
   */
  const pay = async () => {
    // **`try` 안에서 옵셔널 체이닝을 쓰지 않는다.** React Compiler가 try/catch 안의
    // 값 블록(옵셔널 체이닝·조건식 등)을 만나면 이 컴포넌트 최적화를 통째로 포기한다 (#223).
    if (!requestPayment || !address || !pet) {
      return;
    }

    // **저장소는 렌더가 아니라 여기서 읽는다.** 서버 렌더에는 `sessionStorage`가 없고,
    // 눌린 순간의 값을 봐야 다른 탭이 지운 것도 반영된다.
    // 삼항은 `try` 밖에 둔다 — React Compiler가 try 안의 값 계산을 만나면 최적화를 포기한다 (#223)
    const stored = readPendingOrder();
    // 본문이 같으면 그때의 주문과 키를 그대로 쓰고, 다르면 새 키로 새 주문을 만든다
    const pending =
      stored !== null && stored.signature === orderSignature
        ? stored
        : newPendingOrder(orderSignature);
    // 새로 만들면 들고 있던 주문은 쓸 일이 없다. 결제 대기로 남아 재고 예약을 붙잡지 않게
    // 먼저 푼다 (#412)
    const superseded = stored !== null && stored !== pending ? stored.orderId : null;
    // `catch`가 주문 생성에서 막혔는지 가르는 데도 쓴다
    let orderId = pending.orderId;

    setPaying(true);
    try {
      if (superseded !== null) {
        await releaseOrder(superseded);
      }
      if (orderId === null) {
        // **보내기 전에 적어 둔다.** 응답을 잃어도 다음 누름이 같은 키로 물어, 서버가 이미
        // 만든 주문을 돌려받는다 (#412)
        writePendingOrder(pending);
        const created = await createOrder(
          { ...orderRequest, addressId: address.addressId, petId: Number(pet.id) },
          pending.idempotencyKey,
        );
        orderId = created.orderId;
        writePendingOrder({ ...pending, orderId });
      }
      // **`amount`는 서버가 만든 주문의 금액이다.** 화면이 장바구니로 센 `total`과
      // 갈릴 수 있어 결제창에는 이쪽을 싣는다 (#312)
      const { tossOrderId, orderName, amount } = await preparePayment({ orderId });
      // 숫자 `orderId`도 함께 넘긴다. 위젯이 그것을 복귀 주소에 실어, 결제가 끝난 뒤
      // 주문 상세로 갈 수 있게 한다 (#301)
      await requestPayment({ tossOrderId, orderName, orderId, amount });
    } catch (error) {
      // **들고 있던 주문이나 키로는 더 갈 수 없다.** 이미 결제됐거나 취소됐거나 사라진 주문을
      // 물고 있으면 다시 눌러도 같은 자리에서 막힌다 — 탭을 닫기 전까지 결제할 수 없고, 사용자는
      // 탭을 닫으면 풀린다는 것을 알 길이 없다 (#388). 비워 두면 다음에 새 주문으로 간다.
      // 여기서 곧바로 다시 만들지는 않는다 — 실패를 알린 뒤 사용자가 누르는 편이 예측 가능하다
      if (shouldForgetOrder(error, orderId === null)) {
        clearPendingOrder();
      }
      toastAppError(toPayFailureCode(error), error);
      // 결제창이 떴으면 브라우저가 떠나므로 여기로 돌아오지 않는다. 실패했을 때만 되돌린다
      setPaying(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="결제하기" />

      {/* 시안이 섹션 사이를 20px로 띄우고 구분선을 그 가운데 둔다 */}
      <main className="flex flex-1 flex-col gap-5 pt-3">
        <Section
          title="배송지 정보"
          action={
            // **배송지를 알기 전에는 내걸지 않는다.** 조회 중에 "없음" 쪽으로 그리면 목록이
            // 도착하는 순간 문구와 목적지가 함께 바뀌어 누르려던 것이 손 밑에서 달라지고,
            // 조회 실패에서 그리면 같은 자리에 오류 문구와 "배송지 등록"이 함께 떠 사용자가
            // 실패를 미등록으로 읽는다 (#259 리뷰).
            //
            // 등록된 곳이 없으면 고를 목록도 없다. 시안(`empty_dilivery 2`)이 이 자리의
            // 문구를 "배송지 등록"으로 바꾸고 등록 화면으로 곧장 보낸다
            !addressLoading &&
            !addressError && (
              <Link
                href={
                  address
                    ? "/payment/address"
                    : // 등록을 마치면 이 화면으로 돌아온다. **고른 것을 들고 간다** —
                      // 빠뜨리면 돌아왔을 때 장바구니 전체로 읽힌다 (#364와 같은 자리다)
                      `/mypage/address/new?${new URLSearchParams({
                        from: toCheckoutPath(searchParams.toString()),
                      })}`
                }
                className="inline-flex min-h-11 items-center text-body-regular-14 text-text-body-secondary"
              >
                {address ? "배송지 변경" : "배송지 등록"}
              </Link>
            )
          }
        >
          {addressLoading && <FieldRowsSkeleton />}

          {/* 조회 실패는 토스트가 아니라 화면이 직접 보여 준다. 사라지면 왜 비었는지 알 수 없다 */}
          {addressError && (
            <EmptyState
              role="alert"
              className="py-6"
              {...APP_MESSAGE[toAppMessageCode(addressError)]}
            />
          )}

          {!addressLoading &&
            !addressError &&
            (address ? (
              <dl className="flex flex-col gap-3">
                <FieldRow term="받는 분" description={address.receiver} />
                <FieldRow term="연락처" description={address.phone} />
                <FieldRow
                  term="주소"
                  description={`${address.address} ${address.addressDetail}`.trim()}
                />
              </dl>
            ) : (
              <EmptyState
                className="py-6"
                title="아직 등록된 배송지가 없어요"
                // 시안(`2115:171079`)과 배송지 목록의 빈 상태와 같은 문구다 (#422)
                description="상품을 안전하게 받아보실 주소를 미리 등록해 주세요"
              />
            ))}

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="delivery-request"
              className="text-body-medium-14 text-text-body-secondary"
            >
              배송 요청사항
            </Label>
            <Select value={request} onValueChange={setRequest}>
              {/* 시안이 44px 박스에 20px 화살표를 둔다. shadcn이 `data-[size=default]:h-8`로
                  높이를 못박아 같은 속성으로는 덮이지 않으므로 최소 높이로 올린다 */}
              <SelectTrigger
                id="delivery-request"
                className="min-h-11 w-full rounded-lg px-3 text-body-medium-16 text-foreground [&_svg]:size-5"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 직접 입력을 고른 뒤에만 칸이 열린다(paym_001_직접입력) */}
            {request === REQUEST_DIRECT && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="direct-request" className="sr-only">
                  배송 요청사항 직접 입력
                </Label>
                <Textarea
                  id="direct-request"
                  placeholder={`배송 요청사항을 작성해주세요 (최대 ${REQUEST_MAX}자)`}
                  maxLength={REQUEST_MAX}
                  value={directRequest}
                  onChange={(event) => setDirectRequest(event.target.value)}
                  className="min-h-24"
                />
                <p className="self-end text-caption-regular-12 text-text-body-secondary">
                  {directRequest.length}/{REQUEST_MAX}자
                </p>
              </div>
            )}
          </div>
        </Section>

        <hr className="border-border" />

        <Section title="결제 정보">
          {/* **도착 예정일 줄은 그리지 않는다.** 시안(`paym_001`)에는 있지만 서버가 그 값을
              주지 않는다. 시안 문구를 그대로 두면 오늘이 며칠이든 "모레(9/3)"이라 지난 날짜가
              모든 주문에 뜬다 (#259 리뷰). 배송일을 받게 되면 `DeliveryNotice`로 되살린다 */}

          {cartLoading && <OrderItemSkeleton />}

          {cartError && (
            <EmptyState
              role="alert"
              className="py-6"
              {...APP_MESSAGE[toAppMessageCode(cartError)]}
            />
          )}

          {!cartLoading &&
            !cartError &&
            (items.length === 0 ? (
              <EmptyState
                className="py-6"
                title="결제할 상품이 없어요"
                description="장바구니에서 살 수 있는 상품을 골라 주세요"
              />
            ) : (
              // 시안(`paym_001`)은 한 줄만 그렸지만 장바구니에서 여러 줄을 고를 수 있다
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={cartItemKey(item)}>
                    <OrderItemRow item={item} />
                  </li>
                ))}
              </ul>
            ))}

          {/* **살 상품이 있을 때만 금액을 그린다.** 없을 때 그리면 배송비만 더한 "결제금액 3,000원"이
              "결제할 상품이 없어요" 옆에 뜬다. 장바구니 화면도 상품이 없으면 금액 줄을 숨긴다 (#422) */}
          {!cartLoading && !cartError && items.length > 0 && (
            // **dl 아래에는 이름·값 짝만 둔다.** 간격을 주려고 한 겹 더 감싸면 보조기기가 짝을 읽지
            // 못한다(`definition-list`·`dlitem`, #341). 묶음 간격은 dl 밖에서 준다 (#422)
            <div className="flex flex-col gap-2">
              <dl>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-label-bold-14 text-surface-primary">결제금액</dt>
                  <dd className="text-title-bold-16 text-surface-primary">{formatWon(total)}</dd>
                </div>
              </dl>
              {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
                  금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
                  임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
              <dl className="flex flex-col gap-1 text-body-medium-14 text-text-body-secondary">
                <div className="flex items-center justify-between gap-2">
                  <dt>상품 옵션</dt>
                  <dd>{formatWon(itemPrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>배송비</dt>
                  <dd>{formatWon(SHIPPING_FEE)}</dd>
                </div>
              </dl>
            </div>
          )}
        </Section>

        <hr className="border-border" />

        <Section title="결제 방법">
          {/* **`customerKey`를 넘기지 못한다.** 그 값은 `[2] POST /payments`가 주는데 그 호출은
              결제 버튼을 누른 뒤라, 위젯은 비회원(`ANONYMOUS`)으로 열린다.

              **지금은 이것을 문제로 보지 않는다.** 회원으로 열어야 얻는 것은 저장해 둔 결제수단을
              다시 쓰는 일인데, 실결제가 되지 않아 저장할 카드가 없다. 실결제를 붙일 때 다시
              본다 — `customerKey`는 이미 prop이라 값만 꽂으면 된다 (#255) */}
          <TossPaymentWidget
            amount={total}
            // 함수를 state에 넣을 때는 updater로 읽히지 않게 한 번 더 감싼다
            onReady={(fn) => setRequestPayment(() => fn)}
          />
        </Section>

        <section aria-labelledby="terms-heading" className="flex flex-col gap-2 px-5">
          <h2 id="terms-heading" className="text-label-bold-14 text-foreground">
            안전한 결제를 위해 약관에 동의해 주세요
          </h2>

          <div className="flex flex-col gap-1">
            <CheckboxRow
              className={TERM_ROW}
              labelClassName="text-label-bold-14 text-surface-primary"
              label="[전체 동의]"
              checked={allAgreed}
              onCheckedChange={(on) => setAgreed(on ? TERMS.map((term) => term.id) : [])}
            />
            {TERMS.map((term) => (
              <CheckboxRow
                key={term.id}
                className={TERM_ROW}
                labelClassName={TERM_LABEL}
                label={`[${term.required ? "필수" : "선택"}] ${term.label}`}
                checked={agreed.includes(term.id)}
                onCheckedChange={(on) => toggle(term.id, on)}
              />
            ))}
          </div>
        </section>

        {/* 누르면 토스 결제창이 뜬다. 끝나면 브라우저가 완료 화면이나 이 화면으로 돌아온다.
            필수 동의 전에는 누를 수 없다 — 결제는 되돌릴 수 없는 동작이다.
            시안 버튼이 48px이라 기본 44px을 덮는다 */}
        <div className="px-5 pt-1 pb-8">
          <Button
            className={cn("h-12 w-full rounded-lg", "text-label-bold-16")}
            disabled={!canPay}
            onClick={() => void pay()}
          >
            {/* 주문 생성과 결제 요청 두 왕복이 걸린다. 그동안 가만히 있으면 다시 누른다 */}
            <LoadingSwap loading={paying} label="결제창을 여는 중">
              결제하기
            </LoadingSwap>
          </Button>
        </div>
      </main>
    </div>
  );
}
