// 주문 완료. 언제 도착하는지 먼저 알리고 무엇을 얼마에 샀는지 남긴다.
// 와이어프레임 기준(paym_002)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";
import { IoClose } from "react-icons/io5";

import { Button } from "@/shared/ui/button";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { DetailCard } from "@/shared/ui/detail-card/detail-card";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";

/** API 연동 전까지 화면 확인용 값 */
const MOCK = {
  productName: "상품명",
  option: "상품 옵션",
  arriveAt: "모레(9/3)",
  paidAt: "26.08.28 15:43",
  total: 12345,
  itemPrice: 9345,
  shippingFee: 3000,
  payMethod: "토스페이",
  receiver: "천경진",
  phone: "010-1234-5678",
  address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
  request: "문 앞에 놓아주세요.",
};

export function CheckoutDoneView() {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      {/* 되돌아갈 곳이 없는 화면이라 뒤로가기 대신 닫기를 둔다 (paym_002) */}
      <PageHeader
        leading="none"
        right={
          <Link
            href="/"
            aria-label="닫기"
            className="flex size-11 items-center justify-center text-foreground"
          >
            <IoClose aria-hidden className="size-6" />
          </Link>
        }
      />

      <main className="flex flex-1 flex-col gap-3 px-4 pb-8">
        <div className="flex flex-col items-center gap-1 pb-2">
          <h1 className="text-lg font-bold text-foreground">주문을 무사히 마쳤어요</h1>
          <p className="text-sm text-muted-foreground">
            상품이 출발하면 알림으로 가장 먼저 알려드릴게요
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <ProductSummary name={MOCK.productName} meta={MOCK.option} />
          <p className="text-center text-sm font-medium text-foreground">
            {MOCK.arriveAt} 문 앞으로 도착할 예정이에요
          </p>
        </section>

        <DetailCard title="결제상세" titleTrailing={MOCK.paidAt}>
          <DefinitionRow
            term={<span className="font-medium text-foreground">결제금액</span>}
            description={<span className="font-bold">{formatWon(MOCK.total)}</span>}
            alignEnd
            className="px-0"
          />
          {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
          금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
          임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
          <DefinitionRow
            term="상품 옵션"
            description={formatWon(MOCK.itemPrice)}
            alignEnd
            className="px-0"
          />
          <DefinitionRow
            term="배송비"
            description={formatWon(MOCK.shippingFee)}
            alignEnd
            className="px-0"
          />
          <DefinitionRow
            term={<span className="font-medium text-foreground">결제수단</span>}
            description={MOCK.payMethod}
            alignEnd
            className="px-0"
          />
        </DetailCard>

        <DetailCard title="배송지 정보">
          <DefinitionRow term="받는 사람" description={MOCK.receiver} alignEnd className="px-0" />
          <DefinitionRow term="연락처" description={MOCK.phone} alignEnd className="px-0" />
          <div className="flex flex-col gap-1 py-2">
            <dt className="text-sm text-muted-foreground">배송지 주소</dt>
            <dd className="text-sm text-foreground">{MOCK.address}</dd>
          </div>
          <div className="flex flex-col gap-1 py-2">
            <dt className="text-sm text-muted-foreground">배송 요청사항</dt>
            <dd className="text-sm text-foreground">{MOCK.request}</dd>
          </div>
        </DetailCard>

        <Button className="min-h-11 w-full" asChild>
          <Link href="/">처음으로 가기</Link>
        </Button>
      </main>
    </div>
  );
}
