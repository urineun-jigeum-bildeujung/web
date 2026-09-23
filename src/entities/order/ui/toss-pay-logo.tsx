// 토스페이 로고. 결제상세의 결제수단 줄과 반품 신청의 환불 수단 줄이 같은 그림을 쓴다.
// UI 시안 기준(paym_001 521:17511, mypa_361 3324:39004)이다. 83×16 (#408).
//
// **SVG가 아니라 PNG다.** 파란 심벌이 시안에서 래스터(패턴 채움)라, SVG로 내보내면 1.3MB짜리
// base64를 물고 나온다. 3배로 받은 PNG가 6KB다.
//
// **최적화를 거치지 않는다(`unoptimized`).** 83×16짜리 6KB 파일이라 WebP로 바꿔 얻을 것이
// 없는데, `next/image`는 그 한 장을 받으려고 `/_next/image?url=…&w=96&q=75`를 한 번 더 왕복한다.
// CI에서 그 요청이 끝나지 않아 주문 상세가 `networkidle`에 걸려 E2E가 되풀이 실패했다 —
// 트레이스에 응답 없는 요청이 정확히 그것 하나였다 (#324). 상품 상세의 작은 아이콘들도 같은
// 이유로 `unoptimized`다.

import Image from "next/image";

export function TossPayLogo() {
  return (
    <Image src="/images/payment/toss-pay.png" alt="토스페이" width={83} height={16} unoptimized />
  );
}
