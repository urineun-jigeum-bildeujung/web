// 주문 완료. 언제 도착하는지 먼저 알리고 무엇을 얼마에 샀는지 남긴다.
// UI 시안 기준(paym_002 521:17632)이다.
//
// 흰 바닥에 요약 카드 하나만 떠 있고 결제상세·배송지는 카드 없이 그대로 놓인다.
// 그 두 블록은 주문 상세(mypa_161)와 같아 `entities/order`의 조각을 쓴다 (#210).

import Link from "next/link";
import { IoImageOutline } from "react-icons/io5";

import { DeliveryDetail, DetailRow, DetailSection, PaymentDetail } from "@/entities/order";

import type { PaymentConfirmResult } from "../api/payment";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";

/** API 연동 전까지 화면 확인용 값 */
const MOCK = {
  /** 문의할 때 사용자가 대는 유일한 식별자다. 실제 값은 결제 승인 응답이 준다 */
  orderNo: "20260829-1234567",
  /** 주문 상세로 가는 식별자. 주문번호와 같은 값인지는 API 계약이 정해져야 안다 */
  orderId: "1",
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

type CheckoutDoneViewProps = {
  /** 결제창이 성공으로 돌아와 승인까지 끝난 결과. 주소창으로 바로 들어오면 없다 */
  payment?: PaymentConfirmResult | null;
};

export function CheckoutDoneView({ payment }: CheckoutDoneViewProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 되돌아갈 곳이 없는 화면이라 뒤로가기 대신 닫기를 오른쪽에 둔다 (paym_002) */}
      <PageHeader
        leading="none"
        right={
          <Link
            href="/"
            aria-label="닫기"
            className="flex size-11 items-center justify-center text-foreground"
          >
            <Icon name="cancel" />
          </Link>
        }
      />

      <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-8">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-title-bold-16 text-foreground">주문을 무사히 마쳤어요</h1>
            <p className="text-body-medium-14 text-text-body-secondary">
              상품이 출발하면 알림으로 가장 먼저 알려드릴게요
            </p>
          </div>

          {/* 시안의 그림자는 `0 0 11.35px` 한 겹인데 토큰 다섯 단계는 모두 두 겹에 y 오프셋이 있다.
              가장 가까운 `shadow-sm`(blur 12px)으로 옮겼다 */}
          <section className="flex w-full flex-col gap-2 rounded-lg bg-card py-4 shadow-sm">
            {/* 카드는 위아래 여백만 갖고 좌우 여백은 안쪽 줄이 각자 가진다 (paym_002) */}
            <dl className="px-3">
              <DetailRow
                term={<span className="text-label-bold-14 text-foreground">주문번호</span>}
                description={
                  <span className="text-body-regular-14 text-text-body-secondary">
                    {payment?.orderNumber ?? MOCK.orderNo}
                  </span>
                }
              />
            </dl>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 px-3">
                {/* 디자인 시스템 icon 43종에 이미지 글리프가 없어 react-icons로 채운다 (AGENTS.md 5.3) */}
                <span
                  aria-hidden
                  className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-icon-fill-secondary"
                >
                  <IoImageOutline className="size-8" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-title-bold-16 text-foreground">{MOCK.productName}</p>
                  <p className="truncate text-body-medium-14 text-text-body-secondary">
                    {MOCK.option}
                  </p>
                </div>
              </div>

              {/* 언제 오는지가 이 화면에서 가장 궁금한 것이라 날짜만 굵게 둔다 */}
              <p className="flex items-center justify-center gap-0.5 text-text-body-secondary">
                <span className="text-label-bold-14">{MOCK.arriveAt}</span>
                <span className="text-body-medium-14">문 앞으로 도착할 예정이에요</span>
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <DetailSection title="결제상세" titleTrailing={MOCK.paidAt}>
            <PaymentDetail
              total={payment?.amount ?? MOCK.total}
              itemPrice={MOCK.itemPrice}
              shippingFee={MOCK.shippingFee}
              payMethod={payment?.method ?? MOCK.payMethod}
            />
          </DetailSection>

          <DetailSection title="배송지 정보">
            <DeliveryDetail
              receiver={MOCK.receiver}
              phone={MOCK.phone}
              address={MOCK.address}
              request={MOCK.request}
            />
          </DetailSection>
        </div>
      </main>

      {/* 시안(paym_002)이 둘을 나란히 둔다. 방금 한 주문을 바로 확인할 수 있어야
          주문 내역을 다시 찾아 들어가지 않는다. 시안 버튼이 48px이라 기본 44px을 덮는다 */}
      <BottomActionBar className="[&>*]:h-12">
        <Button
          variant="secondary"
          className="bg-surface-tertiary text-foreground hover:bg-surface-tertiary/80"
          asChild
        >
          <Link href={`/mypage/orders/${payment?.orderNumber ?? MOCK.orderId}`}>
            주문 상세 보기
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">홈으로 가기</Link>
        </Button>
      </BottomActionBar>
    </div>
  );
}
