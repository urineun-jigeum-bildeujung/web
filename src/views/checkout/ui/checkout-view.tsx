// 결제하기. 어디로 보낼지, 무엇을 얼마에 사는지, 어떻게 낼지를 한 화면에서 확인한다.
// UI 시안 기준(paym_001 421:16488, paym_001_드롭다운, paym_001_직접입력)이다.
//
// **결제 방법 자리는 시안이 라디오 5종과 페이 로고 3종을 그렸지만 그리지 않는다.**
// 그 자리는 토스 결제위젯이 차지한다 (#212). 섹션 제목과 여백만 시안에 맞춘다.
//
// **승인은 시크릿 키를 쥔 백엔드가 맡는다** — 우리는 결제창을 띄우는 데까지다.

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoImageOutline } from "react-icons/io5";

import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { DeliveryNotice } from "./delivery-notice";
import { FieldRow } from "./field-row";
import { TossPaymentWidget } from "./toss-payment-widget";

/** API 연동 전까지 화면 확인용 값 */
const MOCK = {
  receiver: "천경진",
  phone: "010-1234-5678",
  address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
  arriveAt: "모레(9/3)",
  productName: "상품명",
  option: "상품 옵션",
  quantity: 1,
  total: 12345,
  itemPrice: 9345,
  shippingFee: 3000,
};

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
  const [requestPayment, setRequestPayment] = useState<(() => Promise<void>) | null>(null);
  // 주문번호는 화면이 열릴 때 한 번만 만든다. 원래 백엔드 `POST /payments`가 줄 값이다
  const [orderId] = useState(() => `order_${crypto.randomUUID()}`);

  // 결제창이 실패나 취소로 돌아오면 `?code=`가 붙는다. 왜 돌아왔는지 알려야 다시 시도한다
  const failCode = useSearchParams().get("code");
  useEffect(() => {
    if (failCode) {
      toastAppError(APP_MESSAGE_CODE.payment.failed, failCode);
    }
  }, [failCode]);

  const requiredIds = TERMS.filter((term) => term.required).map((term) => term.id);
  const canPay = requiredIds.every((id) => agreed.includes(id)) && requestPayment !== null;
  const allAgreed = TERMS.every((term) => agreed.includes(term.id));

  const toggle = (id: string, on: boolean) =>
    setAgreed((prev) => (on ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));

  /**
   * 결제창을 띄운다.
   *
   * **실패가 두 갈래라 여기서도 받아야 한다.** 결제창이 뜬 뒤의 실패·취소는 토스가 `failUrl`로
   * 되돌려 보내 `?code=`로 알 수 있지만, 창을 띄우기도 전에 막히면(파라미터 오류, 이미 진행 중인
   * 요청 등) 리다이렉트가 일어나지 않고 약속만 깨진다. 놓치면 눌러도 아무 일이 없어 보인다.
   */
  const pay = async () => {
    // **`try` 안에서 옵셔널 체이닝을 쓰지 않는다.** React Compiler가 try/catch 안의
    // 값 블록(옵셔널 체이닝·조건식 등)을 만나면 이 컴포넌트 최적화를 통째로 포기한다 (#223).
    if (!requestPayment) {
      return;
    }
    try {
      await requestPayment();
    } catch (error) {
      toastAppError(APP_MESSAGE_CODE.payment.failed, error);
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
            <Link
              href="/payment/address"
              className="inline-flex min-h-11 items-center text-body-regular-14 text-text-body-secondary"
            >
              배송지 변경
            </Link>
          }
        >
          <dl className="flex flex-col gap-3">
            <FieldRow term="받는 분" description={MOCK.receiver} />
            <FieldRow term="연락처" description={MOCK.phone} />
            <FieldRow term="주소" description={MOCK.address} />
          </dl>

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
          <DeliveryNotice>지금 주문하면 {MOCK.arriveAt} 도착해요</DeliveryNotice>

          <div className="flex items-start gap-2">
            {/* 디자인 시스템 icon 43종에 이미지 글리프가 없어 react-icons로 채운다 (AGENTS.md 5.3).
                주문 완료(`paym_002`)도 같은 자리에 같은 것을 쓴다 */}
            <span
              aria-hidden
              className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-icon-fill-secondary"
            >
              <IoImageOutline className="size-7" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch">
              <div className="flex flex-col gap-1">
                <p className="truncate text-title-bold-16 text-surface-primary">
                  {MOCK.productName}
                </p>
                <p className="truncate text-body-medium-14 text-text-body-secondary">
                  {MOCK.option}
                </p>
              </div>
              <dl>
                {/* 시안이 이 줄만 이름과 값을 16px 띄운다 */}
                <FieldRow term="주문 수량" description={`${MOCK.quantity}개`} className="gap-4" />
              </dl>
            </div>
          </div>

          <dl className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-label-bold-14 text-surface-primary">결제금액</dt>
              <dd className="text-title-bold-16 text-surface-primary">{formatWon(MOCK.total)}</dd>
            </div>
            {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
                금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
                임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
            <div className="flex flex-col gap-1 text-body-medium-14 text-text-body-secondary">
              <div className="flex items-center justify-between gap-2">
                <dt>상품 옵션</dt>
                <dd>{formatWon(MOCK.itemPrice)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>배송비</dt>
                <dd>{formatWon(MOCK.shippingFee)}</dd>
              </div>
            </div>
          </dl>
        </Section>

        <hr className="border-border" />

        <Section title="결제 방법">
          <TossPaymentWidget
            amount={MOCK.total}
            orderId={orderId}
            orderName={MOCK.productName}
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
            결제하기
          </Button>
        </div>
      </main>
    </div>
  );
}
