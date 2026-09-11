// 결제 수단 관리 라우트.
import { MOCK_CARDS, PaymentMethodsView } from "@/views/payment-methods";

export default function PaymentMethodsPage() {
  // 목록은 연동 전까지 목데이터다. 서버가 내려주면 이 자리에서 조회한다.
  return <PaymentMethodsView cards={MOCK_CARDS} />;
}
