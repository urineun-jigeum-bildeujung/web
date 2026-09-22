// 만들어 둔 주문을 탭 안에서만 들고 있는다. 결제창 리다이렉트를 건너 살아남아야 해서다.
//
// **컴포넌트 상태로는 모자란다.** 결제창에서 취소하거나 실패하면 브라우저가 `failUrl`로
// 돌아오면서 화면이 새로 마운트되고, 그때 들고 있던 주문이 사라진다. 그다음 결제하기를
// 누르면 주문을 또 만들어 `PENDING` 주문이 주문 내역에 "결제 대기" 줄로 쌓인다 (#367).
//
// **`localStorage`가 아니라 `sessionStorage`다.** 탭을 닫으면 사라져야 한다. 다른 날 열어도
// 남아 있으면 낡은 주문을 물고 갈 여지가 커진다.
//
// **주소창에 싣지 않는다.** `failUrl`에 주문 id를 실으면 사용자가 바꿀 수 있어 남의 주문으로
// 결제를 시도하게 된다. 서버가 소유자를 보고 막지만 그 앞에서 막는 편이 낫다.

const KEY = "checkout.pendingOrder";

/** 만들어 둔 주문과 그때 보낸 본문의 지문. 지문이 같을 때만 다시 쓴다 */
export type PendingOrder = {
  orderId: number;
  signature: string;
};

/**
 * `sessionStorage`는 막힐 수 있다.
 *
 * 사생활 보호 모드나 저장소 차단 설정에서는 접근 자체가 던진다. 결제를 막을 이유가 없으므로
 * 조용히 "없음"으로 떨어뜨린다 — 그러면 주문을 새로 만드는 그전 동작이 된다.
 */
export function readPendingOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isPendingOrder(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writePendingOrder(order: PendingOrder): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // 저장하지 못해도 결제는 그대로 진행된다
  }
}

export function clearPendingOrder(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 지우지 못해도 지문이 다르면 재사용되지 않는다
  }
}

/** 손으로 고쳤거나 옛 모양이 남아 있을 수 있다. 모양이 맞을 때만 쓴다 */
function isPendingOrder(value: unknown): value is PendingOrder {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { orderId, signature } = value as Record<string, unknown>;
  return Number.isInteger(orderId) && (orderId as number) > 0 && typeof signature === "string";
}
