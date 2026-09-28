// /mypage/orders/[orderId]/claim 라우트. 화면 조립은 views/order-claim에 있다.

import { Suspense } from "react";

import { OrderClaimView } from "@/views/order-claim";

export default async function OrderClaimPage({
  params,
  searchParams,
}: PageProps<"/mypage/orders/[orderId]/claim">) {
  const { orderId } = await params;
  const { type } = await searchParams;

  // 단계를 URL(`?step=`)에 담는다. useQueryState가 안에서 useSearchParams를 써서 감싸야
  // 빌드가 통과한다 (AGENTS.md 5.1)
  return (
    <Suspense>
      <OrderClaimView orderId={orderId} type={Array.isArray(type) ? type[0] : type} />
    </Suspense>
  );
}
