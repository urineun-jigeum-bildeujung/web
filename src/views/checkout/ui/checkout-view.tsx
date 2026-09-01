// 결제하기. 어디로 보낼지, 무엇을 얼마에 사는지, 어떻게 낼지를 한 화면에서 확인한다.
// 와이어프레임 기준(paym_001)이라 디자인 확정 시 바뀔 수 있다.
//
// 실제 결제 호출은 붙이지 않는다. 승인은 시크릿 키를 쥔 백엔드가 맡고, 계약이 정해진 뒤에 잇는다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

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

const REQUEST_OPTIONS = [
  "문 앞에 놓아주세요.",
  "경비실에 맡겨주세요.",
  "직접 받을게요.",
  "부재 시 연락 주세요.",
];

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
  const [method, setMethod] = useState("pay");
  const [brand, setBrand] = useState("toss");

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

        <div className="px-4 pb-6">
          {/* 실제 승인은 백엔드가 맡는다. 지금은 완료 화면으로 넘기기만 한다. */}
          <Button className="min-h-11 w-full" onClick={() => router.push("/payment/done")}>
            결제하기
          </Button>
        </div>
      </main>
    </div>
  );
}
