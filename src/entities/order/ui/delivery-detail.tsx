// 배송지 줄들. 받는 분·연락처는 한 줄에 견주고 주소·요청사항은 길어서 아래로 내린다.
// UI 페이지 시안 기준(paym_002 1117:4759)이다.
//
// **지금은 주문 완료(`paym_002`)만 쓴다.** 주문 상세는 2026-09-23 시안부터 항목 이름이 진한
// 색이라 `DetailRow`로 직접 조립한다. 여기를 고치면 주문 완료가 바뀐다 (#405).

import { DetailRow } from "./detail-row";

type DeliveryDetailProps = {
  receiver: string;
  phone: string;
  address: string;
  /** 배송 요청사항. 적지 않고 주문할 수 있어 비어 있을 수 있다 */
  request?: string | null;
};

/** 시안은 굵기가 아니라 색으로 가른다. 이름은 흐리고 값은 진하다 (#439) */
const TERM = "text-body-medium-14 text-text-body-secondary";
const VALUE = "text-body-medium-14 text-foreground";

export function DeliveryDetail({ receiver, phone, address, request }: DeliveryDetailProps) {
  return (
    <dl className="flex flex-col gap-3">
      <DetailRow
        term={<span className={TERM}>받는 분</span>}
        description={<span className={VALUE}>{receiver}</span>}
      />
      <DetailRow
        term={<span className={TERM}>연락처</span>}
        description={<span className={VALUE}>{phone}</span>}
      />
      <DetailRow
        stacked
        term={<span className={TERM}>주소</span>}
        description={<span className={VALUE}>{address}</span>}
      />
      {request && (
        <DetailRow
          stacked
          term={<span className={TERM}>배송 요청사항</span>}
          description={<span className={VALUE}>{request}</span>}
        />
      )}
    </dl>
  );
}
