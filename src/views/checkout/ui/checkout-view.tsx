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

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoImageOutline } from "react-icons/io5";

import { useQueryAddresses } from "@/entities/address";
import { cartItemKey, useQueryCart, type CartItem } from "@/entities/cart";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
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

import { createOrder } from "../api/orders";
import { preparePayment } from "../api/payment";
import { pickOrderItems } from "../model/order-items";
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
      {/* 디자인 시스템 icon 세트에 이미지 글리프가 없어 react-icons로 채운다 (AGENTS.md 5.3).
          주문 완료(`paym_002`)도 같은 자리에 같은 것을 쓴다 */}
      <span
        aria-hidden
        className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-icon-fill-secondary"
      >
        <IoImageOutline className="size-7" />
      </span>
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

export function CheckoutView() {
  const [request, setRequest] = useState(REQUEST_OPTIONS[0]);
  const [directRequest, setDirectRequest] = useState("");
  const [agreed, setAgreed] = useState<string[]>([]);
  // 위젯이 준비되면 결제창을 띄우는 함수를 준다. 준비 전에는 버튼을 잠근다
  const [requestPayment, setRequestPayment] = useState<RequestPayment | null>(null);
  // 주문 생성부터 결제창이 뜨기까지의 왕복. 결제는 되돌릴 수 없어 두 번 눌리면 안 된다
  const [paying, setPaying] = useState(false);

  const searchParams = useSearchParams();
  // 결제창이 실패나 취소로 돌아오면 `?code=`가 붙는다. 왜 돌아왔는지 알려야 다시 시도한다
  const failCode = searchParams.get("code");
  useEffect(() => {
    if (failCode) {
      toastAppError(APP_MESSAGE_CODE.payment.failed, failCode);
    }
  }, [failCode]);

  const { cart, isLoading: cartLoading, error: cartError } = useQueryCart();
  const { addresses, isLoading: addressLoading, error: addressError } = useQueryAddresses();

  // 기본 배송지가 없는 계정도 있다. 그때는 목록 맨 앞을 쓴다 — 조회가 기본을 앞으로 정렬한다
  const address = addresses?.find((place) => place.isDefault) ?? addresses?.[0];

  const items = pickOrderItems(cart?.items, searchParams.get("items"));
  const itemPrice = items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
  const total = itemPrice + SHIPPING_FEE;
  const deliveryNote = request === REQUEST_DIRECT ? directRequest.trim() : request;

  const requiredIds = TERMS.filter((term) => term.required).map((term) => term.id);
  const canPay =
    requiredIds.every((id) => agreed.includes(id)) &&
    requestPayment !== null &&
    address !== undefined &&
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
   * **실패가 두 갈래라 여기서도 받아야 한다.** 결제창이 뜬 뒤의 실패·취소는 토스가 `failUrl`로
   * 되돌려 보내 `?code=`로 알 수 있지만, 창을 띄우기도 전에 막히면(주문 생성 실패, 파라미터
   * 오류 등) 리다이렉트가 일어나지 않고 약속만 깨진다. 놓치면 눌러도 아무 일이 없어 보인다.
   */
  const pay = async () => {
    // **`try` 안에서 옵셔널 체이닝을 쓰지 않는다.** React Compiler가 try/catch 안의
    // 값 블록(옵셔널 체이닝·조건식 등)을 만나면 이 컴포넌트 최적화를 통째로 포기한다 (#223).
    if (!requestPayment || !address) {
      return;
    }

    setPaying(true);
    try {
      const { orderId } = await createOrder({
        addressId: address.addressId,
        items: items.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        // 적지 않았으면 빈 문자열이 아니라 아예 보내지 않는다
        deliveryNote: deliveryNote || null,
      });
      const { tossOrderId, orderName } = await preparePayment({ orderId });
      await requestPayment({ orderId: tossOrderId, orderName });
    } catch (error) {
      toastAppError(APP_MESSAGE_CODE.payment.failed, error);
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
                href={address ? "/payment/address" : "/mypage/address/new"}
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
                description="상품을 안전하게 받아볼 수 있도록 먼저 등록해 주세요"
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

          <dl className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-label-bold-14 text-surface-primary">결제금액</dt>
              <dd className="text-title-bold-16 text-surface-primary">{formatWon(total)}</dd>
            </div>
            {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
                금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
                임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
            <div className="flex flex-col gap-1 text-body-medium-14 text-text-body-secondary">
              <div className="flex items-center justify-between gap-2">
                <dt>상품 옵션</dt>
                <dd>{formatWon(itemPrice)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>배송비</dt>
                <dd>{formatWon(SHIPPING_FEE)}</dd>
              </div>
            </div>
          </dl>
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
