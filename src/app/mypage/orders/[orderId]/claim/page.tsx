// /mypage/orders/[orderId]/claim 라우트. 화면 조립은 views/order-claim에 있다.

import { OrderClaimView } from "@/views/order-claim";

export default async function OrderClaimPage({
  params,
  searchParams,
}: PageProps<"/mypage/orders/[orderId]/claim">) {
  const { orderId } = await params;
  const { type } = await searchParams;

  return <OrderClaimView orderId={orderId} type={Array.isArray(type) ? type[0] : type} />;
}
