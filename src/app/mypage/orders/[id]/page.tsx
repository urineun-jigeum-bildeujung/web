// 주문 상세 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
import { OrderDetailView } from "@/views/order-detail";

export default async function OrderDetailPage({ params }: PageProps<"/mypage/orders/[id]">) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
