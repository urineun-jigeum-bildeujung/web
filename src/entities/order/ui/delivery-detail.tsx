// 배송지 줄들. 받는 사람·연락처는 한 줄에 견주고 주소·요청사항은 길어서 아래로 내린다.
// UI 시안 기준(mypa_161 1238:10083, paym_002 532:17896)이다. 두 화면이 같은 값을 같은 모양으로 쓴다.

import { DetailRow } from "./detail-row";

type DeliveryDetailProps = {
  receiver: string;
  phone: string;
  address: string;
  /** 배송 요청사항. 비어 있을 수 있다 */
  request?: string;
};

/** 시안은 배송지에서만 이름 쪽도 흐린 색을 쓴다. 굵기로만 값과 가른다 */
const TERM = "text-label-bold-14 text-text-body-secondary";
const VALUE = "text-body-medium-14 text-text-body-secondary";

export function DeliveryDetail({ receiver, phone, address, request }: DeliveryDetailProps) {
  return (
    <dl className="flex flex-col gap-3">
      <DetailRow
        term={<span className={TERM}>받는 사람</span>}
        description={<span className={VALUE}>{receiver}</span>}
      />
      <DetailRow
        term={<span className={TERM}>연락처</span>}
        description={<span className={VALUE}>{phone}</span>}
      />
      <DetailRow
        stacked
        term={<span className={TERM}>배송지 주소</span>}
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
