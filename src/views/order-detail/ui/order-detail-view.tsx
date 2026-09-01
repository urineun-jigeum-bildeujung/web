// 주문 상세. 주문정보·결제상세·배송지 정보를 카드로 나눠 보여준다.
// 와이어프레임 기준(mypa_161)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";

import { OrderStatusBadge, type OrderStatus } from "@/entities/order";
import { DefinitionRow } from "@/shared/ui/definition-row/definition-row";
import { DetailCard } from "@/shared/ui/detail-card/detail-card";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";

/** API 연동 전까지 화면 확인용 값. 주문마다 달라 보이도록 번호와 상태를 나눠 둔다. */
const MOCK_ORDERS: Record<string, { orderNo: string; status: OrderStatus }> = {
  "1": { orderNo: "20260829-1234567", status: "preparing" },
  "2": { orderNo: "20260829-1234568", status: "shipping" },
  "3": { orderNo: "20260829-1234569", status: "delivered" },
  "4": { orderNo: "20260829-1234570", status: "confirmed" },
};

const MOCK = {
  orderNo: "20260829-1234567",
  status: "shipping" as OrderStatus,
  productName: "상품명",
  option: "상품 옵션",
  paidAt: "26.08.28 15:43",
  total: 12345,
  itemPrice: 14345,
  shippingFee: 3000,
  pointDiscount: 5000,
  card: "신한카드 ****-****-****-1234",
  receiver: "천경진",
  phone: "010-1234-5678",
  address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
  request: "문 앞에 놓아주세요.",
};

export function OrderDetailView({ orderId }: { orderId?: string }) {
  // 주문마다 다른 화면이 나와야 목록에서 무엇을 눌렀는지 알 수 있다.
  const order = (orderId && MOCK_ORDERS[orderId]) || MOCK_ORDERS["1"];

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <PageHeader title="자세히 보기" />

      <main className="flex flex-1 flex-col gap-3 px-4 pb-8">
        <DetailCard title="주문정보">
          <DefinitionRow term="주문번호" description={order.orderNo} alignEnd className="px-0" />
          <div className="py-2">
            <ProductSummary
              name={MOCK.productName}
              meta={MOCK.option}
              nameTrailing={<OrderStatusBadge status={order.status} />}
            />
          </div>
          <DefinitionRow
            term="결제 금액"
            description={<span className="font-bold">{formatWon(MOCK.total)}</span>}
            alignEnd
            className="px-0"
          />
        </DetailCard>

        <DetailCard title="결제상세" titleTrailing={MOCK.paidAt}>
          <DefinitionRow
            term={<span className="font-medium text-foreground">결제금액</span>}
            description={<span className="font-bold">{formatWon(MOCK.total)}</span>}
            alignEnd
            className="px-0"
          />
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
            term="포인트 할인"
            description={formatWon(MOCK.pointDiscount)}
            alignEnd
            className="px-0"
          />
          <DefinitionRow
            term={<span className="font-medium text-foreground">결제수단</span>}
            description={MOCK.card}
            alignEnd
            className="px-0"
          />
        </DetailCard>

        <DetailCard title="배송지 정보">
          <DefinitionRow term="받는 사람" description={MOCK.receiver} alignEnd className="px-0" />
          <DefinitionRow term="연락처" description={MOCK.phone} alignEnd className="px-0" />
          {/* 주소와 요청사항은 길어서 한 줄에 견주지 않고 아래로 내린다. */}
          <div className="flex flex-col gap-1 py-2">
            <dt className="text-sm text-muted-foreground">배송지 주소</dt>
            <dd className="text-sm text-foreground">{MOCK.address}</dd>
          </div>
          <div className="flex flex-col gap-1 py-2">
            <dt className="text-sm text-muted-foreground">배송 요청사항</dt>
            <dd className="text-sm text-foreground">{MOCK.request}</dd>
          </div>
        </DetailCard>

        {/* 취소·반품·교환·문의·리뷰작성은 아직 화면 스타일이 안 잡혀 있어 링크만 둔다 */}
        <nav className="flex flex-col gap-2">
          <Link
            href={`/mypage/orders/${orderId ?? "1"}/claim?type=cancel`}
            className="text-sm text-primary underline underline-offset-4"
          >
            주문 취소
          </Link>
          <Link
            href={`/mypage/orders/${orderId ?? "1"}/claim?type=return`}
            className="text-sm text-primary underline underline-offset-4"
          >
            반품
          </Link>
          <Link
            href={`/mypage/orders/${orderId ?? "1"}/claim?type=exchange`}
            className="text-sm text-primary underline underline-offset-4"
          >
            교환
          </Link>
          <Link
            href={`/mypage/reviews/write?orderItemId=${orderId ?? "1"}-1`}
            className="text-sm text-primary underline underline-offset-4"
          >
            리뷰 작성
          </Link>
          <Link
            href="/mypage/support/inquiries"
            className="text-sm text-primary underline underline-offset-4"
          >
            문의하기
          </Link>
        </nav>
      </main>
    </div>
  );
}
