// 결제하기. 어디로 보낼지, 무엇을 얼마에 사는지, 어떻게 낼지를 한 화면에서 확인한다.
// UI 페이지 시안 기준(paym_001 1586:23984, paym_001_드롭다운 1586:24254, paym_001_직접입력)이다.
//
// **결제 방법 자리는 시안이 라디오 5종과 페이 로고 3종을 그렸지만 그리지 않는다.**
// 그 자리는 토스 결제위젯이 차지한다 (#212). 섹션 제목과 여백만 시안에 맞춘다.
//
// **승인은 시크릿 키를 쥔 백엔드가 맡는다** — 우리는 결제창을 띄우는 데까지다.
//
// **배송지는 배송지 설정에서 고른 곳, 고르지 않았으면 기본 배송지를 쓴다.** 고른 곳은 이번 주문
// 한 번만 쓰는 값이라 주소(`?address=`)가 들고 다니고 기본 배송지는 바꾸지 않는다 (QA No.40, #595).
// 없을 때는 `empty_dilivery 2`(2022:157931)대로 등록하러 보낸다 (#255).
//
// **결제할 줄은 장바구니에서 고른 것이다.** `?items=NORMAL:1,TIME_DEAL:3`으로 받고,
// 없으면 살 수 있는 줄 전부를 본다 — 주소창으로 바로 들어와도 화면이 성립해야 한다.
//
// **주문에는 기본 아이를 싣는다.** 서버가 `petId`를 필수로 받는데, 여러 아이 중 고르는 자리는
// 시안에 없다. 대표 아이를 둘지 정해지기 전까지 기본 아이로 간다 (#393).

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DELIVERY_NOTE_OPTIONS, DeliveryNoteField, useQueryAddresses } from "@/entities/address";
import { BUY_NOW_PARAM, cartItemKey, parseBuyNow, useQueryCart } from "@/entities/cart";
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
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";

import { createOrder, releaseOrder } from "../api/orders";
import { preparePayment } from "../api/payment";
import { useQueryBuyNowProduct } from "../api/use-query-buy-now-product";
import { arrivalNotice } from "../model/arrival-notice";
import {
  ITEMS_PARAM,
  hasUnavailablePick,
  pickOrderItems,
  toBuyNowLine,
  toOrderItem,
  type OrderLine,
} from "../model/order-items";
import {
  clearPendingOrder,
  newPendingOrder,
  readPendingOrder,
  writePendingOrder,
} from "../model/pending-order";
import {
  ADDRESS_PARAM,
  readAddressId,
  toAddressPickerPath,
  toCheckoutPath,
} from "../model/return-query";
import { DeliveryNotice } from "./delivery-notice";
import { FieldRow } from "./field-row";
import { OrderItemLink } from "./order-item-link";
import { TossPaymentWidget, type TossPaymentOrder } from "./toss-payment-widget";

/** 장바구니 응답에 `deliveryFee`가 없어 고정값을 쓴다. 장바구니 화면과 같은 값이다 (#214) */
const SHIPPING_FEE = 3000;

/**
 * 결제 전 받아야 하는 동의.
 *
 * 필수 셋을 다 켜야 결제할 수 있다. 결제는 되돌릴 수 없는 동작이라, 동의 없이
 * 버튼이 눌리면 사용자가 무엇에 동의했는지 모르는 채로 돈이 나간다.
 *
 * **"[선택] 다음 주문을 위해 이 결제 수단 저장" 줄은 뺐다 (#466).** 서버가 결제 요청마다
 * `customerKey`를 새로 만들어 저장한 결제 수단을 다시 꺼낼 수 없고, 체크해도 실리는 곳이
 * 없었다. 백엔드가 제외를 청했고 PD팀이 동의했다(2026-09-28).
 */
const TERMS = [
  { id: "order", label: "주문 상품 정보 동의", required: true },
  { id: "privacy", label: "개인정보 제3자 제공 동의", required: true },
  { id: "pg", label: "결제 대행 서비스(PG) 이용 약관 동의", required: true },
] as const;

/** 시안의 약관 줄은 32px이다. 원의 누르는 자리는 44px로 넓혀져 있어 그대로 둔다 */
const TERM_ROW = "min-h-8";
// 시안 `body/medium_14`·`text/body/secondary`다. 제목과 [전체 동의]만 진한 글씨다 (#451)
const TERM_LABEL = "text-body-medium-14 text-text-body-secondary";

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

/**
 * 주문할 상품 한 줄. 사진·이름·수량·판매 금액 (`paym_001`, QA No.46 #595)
 *
 * **줄마다 응답에 있는 값만 그린다.** 판매 금액은 그 줄의 `subtotal`(판매가 × 수량)이다. 줄별
 * 배송비와 줄별 결제금액은 응답에 없어 그리지 않는다 — 배송비는 주문 하나에 3,000원 고정이라
 * (`SHIPPING_FEE`) 아래 합계에만 있다.
 */
function OrderItemRow({ item }: { item: OrderLine }) {
  return (
    <div className="flex items-start gap-2">
      {/* 주문 화면들과 같은 80 썸네일이다. 사진이 없으면 자리만 잡는다 (#422) */}
      <OrderProductThumbnail imageUrl={item.thumbnailUrl} />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
        <div className="flex flex-col gap-1">
          {/* 살 수 있는 줄만 여기까지 오므로 이름이 `null`이 아니다.
              시안이 두 줄까지 보이고 넘치면 말줄임한다 (QA No.46).
              **누르면 상세로 간다** — 이름뿐 아니라 줄 어디를 눌러도 간다 (QA No.47) */}
          <OrderItemLink item={item} className="line-clamp-2 text-title-bold-16 text-foreground" />
        </div>
        <dl className="flex flex-col gap-1">
          {/* 시안이 이 줄만 이름과 값을 16px 띄운다 */}
          <FieldRow term="주문 수량" description={`${item.quantity}개`} className="gap-4" />
          {/* 금액을 모르는 줄은 0원으로 그리지 않고 비운다. 공짜로 산 것처럼 보인다 */}
          {item.subtotal !== null && (
            <FieldRow term="판매 금액" description={formatWon(item.subtotal)} className="gap-4" />
          )}
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
        <h2 className="text-title-bold-18 text-foreground">{title}</h2>
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
 * 결제를 시작하지 못한 까닭을 문구 코드로 옮긴다.
 *
 * **서버가 이유를 알려 준 실패는 그 문구를 쓴다.** 재고 부족·판매 중지·배송지 없음처럼 도메인
 * 문구가 있는데 "결제 실패 / 다시 시도해 주세요"로 뭉개면, 다시 눌러도 같은 자리에서 막힌다 (#422).
 * 상태 코드로 떨어진 공통 문구(`common.*`)는 결제 맥락이 빠져 있어 "결제 실패"로 모은다 —
 * 주문 완료 화면의 `toConfirmFailureCode`와 같은 방식이다.
 *
 * **주문 없음도 "결제 실패"로 모은다.** 결제 준비가 들고 있던 주문을 못 찾은 경우라 그 주문은
 * 이미 버렸고(`shouldForgetOrder`), 다시 누르면 새로 만들어 결제된다. 주문 문구의 "주소가 바뀌었을
 * 수 있어요"는 이 화면에 맞지 않고 다시 누를 길도 알려 주지 않는다 (#476)
 */
function toPayFailureCode(error: unknown): AppMessageCode {
  const code = toAppMessageCode(error);
  return code.startsWith("common.") || code === APP_MESSAGE_CODE.order.notFound
    ? APP_MESSAGE_CODE.payment.failed
    : code;
}

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
  // 고른 보기의 문구이거나 직접 적은 글. 첫 보기가 결제의 기본값이다 (1586:24254)
  const [request, setRequest] = useState(DELIVERY_NOTE_OPTIONS[0]);
  const [agreed, setAgreed] = useState<string[]>([]);
  // 위젯이 준비되면 결제창을 띄우는 함수를 준다. 준비 전에는 버튼을 잠근다
  const [requestPayment, setRequestPayment] = useState<RequestPayment | null>(null);
  // 주문 생성부터 결제창이 뜨기까지의 왕복. 결제는 되돌릴 수 없어 두 번 눌리면 안 된다
  const [paying, setPaying] = useState(false);

  // **결제창에서 기기 뒤로가기로 돌아오면 대기를 푼다.** 토스가 창 전체를 결제 페이지로 옮긴 뒤
  // 뒤로가기를 누르면, iOS Safari 같은 브라우저는 이 화면을 뒤로·앞으로 캐시에서 상태째 되살린다.
  // 결제창 약속은 끝나지 않아 `pay`의 되돌림이 돌지 않으니, 두면 새로고침 전까지 결제할 수 없다 (#430)
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setPaying(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

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

  // **배송지 설정에서 고른 곳이 먼저다** (QA No.40, #595). 고르지 않았거나 고른 곳을 그사이 지웠으면
  // 기본 배송지로 돌아간다. 기본 배송지가 없는 계정도 있다. 그때는 목록 맨 앞을 쓴다 — 조회가 기본을
  // 앞으로 정렬한다
  const pickedAddressId = readAddressId(searchParams.get(ADDRESS_PARAM));
  const address =
    addresses?.find((place) => place.addressId === pickedAddressId) ??
    addresses?.find((place) => place.isDefault) ??
    addresses?.[0];
  // 아이 조회도 기본 아이를 앞으로 정렬한다(`getPets`). 기본이 없으면 맨 앞 아이다
  const pet = pets?.[0];

  // **상품 상세의 "바로 구매"는 장바구니를 거치지 않는다** (#520). `?buy=`가 있으면 그 상품 한
  // 줄로 주문하고, 없으면 장바구니에서 고른 줄이다. 둘이 섞이면 장바구니 상품까지 주문된다.
  // **값이 틀려도 `buy`가 있으면 바로 구매다.** 틀린 값을 없는 것으로 읽어 장바구니로 넘어가면
  // 사용자가 고르지 않은 장바구니 상품이 결제 대상이 된다 — 빈 목록으로 둔다 (#521 리뷰)
  const buyNowValue = searchParams.get(BUY_NOW_PARAM);
  const isBuyNow = buyNowValue !== null;
  const buyNow = parseBuyNow(buyNowValue);
  const buyNowProduct = useQueryBuyNowProduct(buyNow);
  const itemsLoading = isBuyNow ? buyNow !== null && buyNowProduct.isPending : cartLoading;
  const itemsError = isBuyNow ? buyNowProduct.error : cartError;
  // 품절이면 줄을 만들지 않는다. 상세에서 넘어온 뒤 재고가 떨어졌거나 주소로 다시 들어온
  // 경우다 — 최종 재고 확인은 서버가 주문을 만들며 한다 (#521 리뷰)
  const buyNowItem =
    buyNow && buyNowProduct.data && !buyNowProduct.data.soldOut
      ? toBuyNowLine(buyNow, buyNowProduct.data)
      : null;
  const items: OrderLine[] = isBuyNow
    ? buyNowItem
      ? [buyNowItem]
      : []
    : pickOrderItems(cart?.items, searchParams.get(ITEMS_PARAM));
  // **고른 상품이 그사이 품절돼 빠졌으면 알린다(QA No.20, #591).** 조용히 빼면 금액이 왜 줄었는지
  // 모른다. 한 화면에서 한 번만 뜬다 — 장바구니를 다시 받아 품절 → 재입고 → 품절로 바뀌어도
  // 다시 알리지 않도록 알린 이력을 ref에 남긴다
  const droppedUnavailable =
    !isBuyNow && hasUnavailablePick(cart?.items, searchParams.get(ITEMS_PARAM));
  const notifiedDropRef = useRef(false);
  useEffect(() => {
    if (droppedUnavailable && !notifiedDropRef.current) {
      notifiedDropRef.current = true;
      showSnackbar("품절된 상품은 제외했어요");
    }
  }, [droppedUnavailable]);
  const itemPrice = items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
  const total = itemPrice + SHIPPING_FEE;
  const deliveryNote = request.trim();

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
  // 결제가 끝나면 장바구니에서 뺄 줄. 주문과 함께 적어 두면 완료 화면이 꺼내 쓴다 (#457).
  // 바로 구매는 장바구니에서 오지 않았다 — 같은 상품이 장바구니에 있어도 빼지 않는다 (#520)
  const cartItems = isBuyNow ? [] : items.map(({ itemType, itemId }) => ({ itemType, itemId }));

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
    // 배송지·아이 id는 본문을 만들 때 이미 옮겨 두었다. 모르면 `null`이라 여기서 거른다
    const { addressId, petId } = orderRequest;
    if (!requestPayment || addressId === null || petId === null) {
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
        : newPendingOrder(orderSignature, cartItems);
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
        const body = { ...orderRequest, addressId, petId };
        // **보내기 전에 적어 둔다.** 응답을 잃어도 다음 누름이 같은 키로 물어, 서버가 이미
        // 만든 주문을 돌려받는다 (#412)
        let held = pending;
        writePendingOrder(held);
        let created = await createOrder(body, held.idempotencyKey);
        // **같은 키로 받은 주문이 이미 취소돼 있으면 새 키로 한 번 더 만든다.** 서버는 주문을
        // 저장한 뒤 재고 예약에서 5xx로 막히면 그 주문을 취소한 채 오류를 낸다. 우리는 5xx라 키를
        // 들고 있다가 같은 키로 다시 묻고, 서버는 그 취소된 주문을 200으로 돌려준다. 그대로 가면
        // 결제 준비에서 또 막혀 세 번째 누름에야 결제됐다 (#442).
        // 결제된 주문처럼 다른 상태는 새로 만들지 않는다 — 결제 준비가 걸러 주고, 두 번 결제될
        // 여지를 만들지 않는다
        if (created.orderStatus === "CANCELLED") {
          held = newPendingOrder(orderSignature, cartItems);
          writePendingOrder(held);
          created = await createOrder(body, held.idempotencyKey);
        }
        orderId = created.orderId;
        writePendingOrder({ ...held, orderId });
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
                    ? // 고른 상품을 들고 간다. 거기서 한 곳을 고르면 이 화면으로 돌아온다 (#595)
                      toAddressPickerPath(searchParams.toString())
                    : // 등록을 마치면 이 화면으로 돌아온다. **고른 것을 들고 간다** —
                      // 빠뜨리면 돌아왔을 때 장바구니 전체로 읽힌다 (#364와 같은 자리다)
                      `/mypage/address/new?${new URLSearchParams({
                        from: toCheckoutPath(searchParams.toString()),
                      })}`
                }
                className="inline-flex min-h-11 items-center text-body-regular-14 text-text-body-tertiary"
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
            {/* 배송지 등록·수정과 같은 보기 목록·같은 칸이다 (#526) */}
            <DeliveryNoteField id="delivery-request" value={request} onChange={setRequest} />
          </div>
        </Section>

        <hr className="border-border" />

        <Section title="결제 정보">
          {/* **도착 예정일은 화면이 센다** (QA No.45, #595). 서버가 배송 예정일을 주지 않아 시안
              문구대로 한국 날짜의 모레를 보인다(`arrivalNotice`). 전에는 시안의 "모레(9/3)"를 그대로
              둘 수 없어 걷어냈었다 (#259 리뷰). 살 상품이 있을 때만 — "지금 주문하면"이라 말한다 */}
          {!itemsLoading && !itemsError && items.length > 0 && (
            <DeliveryNotice>{arrivalNotice(new Date())}</DeliveryNotice>
          )}

          {itemsLoading && <OrderItemSkeleton />}

          {itemsError && (
            <EmptyState
              role="alert"
              className="py-6"
              {...APP_MESSAGE[toAppMessageCode(itemsError)]}
            />
          )}

          {!itemsLoading &&
            !itemsError &&
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
                  // `relative`는 이름 링크가 줄 전체를 덮는 기준이다(`OrderItemLink`, QA No.47)
                  <li key={cartItemKey(item)} className="relative">
                    <OrderItemRow item={item} />
                  </li>
                ))}
              </ul>
            ))}

          {/* **살 상품이 있을 때만 금액을 그린다.** 없을 때 그리면 배송비만 더한 "결제금액 3,000원"이
              "결제할 상품이 없어요" 옆에 뜬다. 장바구니 화면도 상품이 없으면 금액 줄을 숨긴다 (#422) */}
          {!itemsLoading && !itemsError && items.length > 0 && (
            // **dl 아래에는 이름·값 짝만 둔다.** 간격을 주려고 한 겹 더 감싸면 보조기기가 짝을 읽지
            // 못한다(`definition-list`·`dlitem`, #341). 묶음 간격은 dl 밖에서 준다 (#422)
            <div className="flex flex-col gap-2">
              <dl>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-label-bold-14 text-foreground">결제금액</dt>
                  <dd className="text-title-bold-16 text-foreground">{formatWon(total)}</dd>
                </div>
              </dl>
              {/* 시안(`paym_001`)이 이 자리를 "상품 옵션"이라 부른다. 같은 자리를 주문 완료는
                  "판매 금액", 장바구니는 "판매가격"이라 불러 화면마다 다르다. 화면에 그대로 나가는
                  문구라 임의로 맞추지 않고 화면마다 시안을 따른다. */}
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
          <h2 id="terms-heading" className="text-title-bold-16 text-foreground">
            안전한 결제를 위해 약관에 동의해 주세요
          </h2>

          <div className="flex flex-col gap-1">
            <CheckboxRow
              className={TERM_ROW}
              labelClassName="text-title-bold-16 text-foreground"
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
