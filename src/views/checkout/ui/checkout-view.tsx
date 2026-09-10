// 결제하기. 어디로 보낼지, 무엇을 얼마에 사는지, 어떻게 낼지를 한 화면에서 확인한다.
// 와이어프레임 기준(paym_001, paym_001_드롭다운, paym_001_직접입력)이라 디자인 확정 시 바뀔 수 있다.
//
// 실제 결제 호출은 붙이지 않는다. 승인은 시크릿 키를 쥔 백엔드가 맡고, 계약이 정해진 뒤에 잇는다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { DeliveryNotice } from "./delivery-notice";
import { PayMethodPicker } from "./pay-method-picker";

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

/** 카드 하나를 이루는 덩어리. 결제 화면은 제목이 카드 밖에 있어 DetailCard와 형태가 다르다 */
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
    <section className="flex flex-col gap-3 border-b border-border px-4 py-5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CheckoutView() {
  const router = useRouter();
  const [request, setRequest] = useState(REQUEST_OPTIONS[0]);
  const [directRequest, setDirectRequest] = useState("");
  const [method, setMethod] = useState("pay");
  const [brand, setBrand] = useState("toss");
  const [agreed, setAgreed] = useState<string[]>([]);

  const requiredIds = TERMS.filter((term) => term.required).map((term) => term.id);
  const canPay = requiredIds.every((id) => agreed.includes(id));
  const allAgreed = TERMS.every((term) => agreed.includes(term.id));

  const toggle = (id: string, on: boolean) =>
    setAgreed((prev) => (on ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="결제하기" />

      <main className="flex flex-1 flex-col">
        <Section
          title="배송지 정보"
          action={
            <Link
              href="/payment/address"
              className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline"
            >
              수정하기
            </Link>
          }
        >
          <dl className="flex flex-col">
            <DefinitionRow
              term="받는 분"
              description={MOCK.receiver}
              className="min-h-9 px-0 py-1"
            />
            <DefinitionRow term="연락처" description={MOCK.phone} className="min-h-9 px-0 py-1" />
            {/* 주소는 길어 한 줄에 견주지 않는다 */}
            <div className="flex gap-4 py-1">
              <dt className="w-24 shrink-0 text-sm text-muted-foreground">주소</dt>
              <dd className="flex-1 text-sm text-foreground">{MOCK.address}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">배송 요청사항</p>
            <Select value={request} onValueChange={setRequest}>
              <SelectTrigger className="min-h-11 w-full" aria-label="배송 요청사항">
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
                <Textarea
                  aria-label="배송 요청사항 직접 입력"
                  placeholder={`배송 요청사항을 작성해주세요 (최대 ${REQUEST_MAX}자)`}
                  maxLength={REQUEST_MAX}
                  value={directRequest}
                  onChange={(event) => setDirectRequest(event.target.value)}
                  className="min-h-24"
                />
                <p className="self-end text-xs text-muted-foreground">
                  {directRequest.length}/{REQUEST_MAX}자
                </p>
              </div>
            )}
          </div>
        </Section>

        <Section title="결제 정보">
          <DeliveryNotice>지금 주문하면 {MOCK.arriveAt} 도착해요</DeliveryNotice>

          <ProductSummary
            name={MOCK.productName}
            meta={
              <span className="flex flex-col gap-0.5">
                {MOCK.option}
                <span>주문 수량 {MOCK.quantity}개</span>
              </span>
            }
          />

          <dl className="flex flex-col">
            <DefinitionRow
              term={<span className="font-medium text-foreground">결제금액</span>}
              description={<span className="font-bold">{formatWon(MOCK.total)}</span>}
              alignEnd
              className="min-h-9 px-0 py-1"
            />
            {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
            금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
            임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
            <DefinitionRow
              term="상품 옵션"
              description={formatWon(MOCK.itemPrice)}
              alignEnd
              className="min-h-9 px-0 py-1"
            />
            <DefinitionRow
              term="배송비"
              description={formatWon(MOCK.shippingFee)}
              alignEnd
              className="min-h-9 px-0 py-1"
            />
          </dl>
        </Section>

        <Section title="결제 방법">
          <PayMethodPicker
            method={method}
            onMethodChange={setMethod}
            brand={brand}
            onBrandChange={setBrand}
          />
        </Section>

        <section aria-labelledby="terms-heading" className="flex flex-col gap-2 px-4 py-5">
          <h2 id="terms-heading" className="text-sm font-bold text-foreground">
            안전한 결제를 위해 약관에 동의해 주세요
          </h2>

          <CheckboxRow
            label="전체 동의"
            checked={allAgreed}
            onCheckedChange={(on) => setAgreed(on ? TERMS.map((term) => term.id) : [])}
          />

          <div className="flex flex-col border-t border-border pt-2">
            {TERMS.map((term) => (
              <CheckboxRow
                key={term.id}
                label={`[${term.required ? "필수" : "선택"}] ${term.label}`}
                checked={agreed.includes(term.id)}
                onCheckedChange={(on) => toggle(term.id, on)}
              />
            ))}
          </div>
        </section>

        <div className="px-4 pb-6">
          {/* 실제 승인은 백엔드가 맡는다. 지금은 완료 화면으로 넘기기만 한다.
              필수 동의 전에는 누를 수 없다 — 결제는 되돌릴 수 없는 동작이다 */}
          <Button
            className="min-h-11 w-full"
            disabled={!canPay}
            onClick={() => router.push("/payment/done")}
          >
            결제하기
          </Button>
        </div>
      </main>
    </div>
  );
}
