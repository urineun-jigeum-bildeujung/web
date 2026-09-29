// 주문 상세 라우트. 화면 조립은 views/order-detail에 있다.
import { OrderDetailView } from "@/views/order-detail";

export default async function OrderDetailPage({ params }: PageProps<"/mypage/orders/[orderId]">) {
  const { orderId } = await params;
  return <OrderDetailView orderId={orderId} />;
}
