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
//
// **주문 생성 키도 함께 든다.** 주문 생성은 `Idempotency-Key`로 같은 요청을 알아본다. 응답을
// 잃고 다시 누를 때 같은 키를 실어야 서버가 이미 만든 주문을 돌려준다 — 키를 새로 만들면
// 주문이 하나 더 생긴다 (#412).

const KEY = "checkout.pendingOrder";

/**
 * 만들려는(또는 만든) 주문과 그때 보낸 본문의 지문. 지문이 같을 때만 다시 쓴다.
 *
 * **키는 지문과 한 쌍이다.** 서버는 같은 키로 온 요청에 본문을 견주지 않고 처음 만든 주문을
 * 돌려준다. 본문이 바뀌었는데 키를 그대로 쓰면 옛 주문이 온다 (#412).
 */
export type PendingOrder = {
  signature: string;
  /** 주문 생성에 실은 `Idempotency-Key` */
  idempotencyKey: string;
  /** 서버가 만든 주문. 생성 응답을 받기 전에는 없다 */
  orderId: number | null;
};

/** 이 본문으로 처음 주문을 만들 때. 키는 여기서 한 번만 만든다 */
export function newPendingOrder(signature: string): PendingOrder {
  return { signature, idempotencyKey: newIdempotencyKey(), orderId: null };
}

/**
 * UUID v4 모양의 키. 백엔드 명세가 "UUID 권장"이다(서버는 100자 이하 문자열을 받는다).
 *
 * **`crypto.randomUUID`를 쓰지 않는다.** 보안 출처(https·localhost)에서만 있는 함수라, 앱을
 * Android 에뮬레이터로 열 때의 `http://10.0.2.2:3000`에서는 결제하기가 여기서 던진다.
 * `getRandomValues`는 어느 출처에서나 있다 (#432).
 */
function newIdempotencyKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // 버전 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 9562 변형
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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

/**
 * 손으로 고쳤거나 옛 모양이 남아 있을 수 있다. 모양이 맞을 때만 쓴다.
 *
 * 키가 없는 #412 전 모양도 여기서 걸러진다. 배포 뒤 처음 한 번 새 주문을 만드는 것으로 끝난다.
 */
function isPendingOrder(value: unknown): value is PendingOrder {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { orderId, signature, idempotencyKey } = value as Record<string, unknown>;
  const validOrderId = orderId === null || (Number.isInteger(orderId) && (orderId as number) > 0);
  return (
    validOrderId &&
    typeof signature === "string" &&
    typeof idempotencyKey === "string" &&
    idempotencyKey.length > 0
  );
}
