// 상품 상세에 들어오면 그 상품을 최근 본 상품으로 남긴다 (#509).
//
// PRD "최근 본 상품 조회"는 검색에서 들어간 상세와 상품 상세를 모두 기록 대상으로 적는다 — 둘 다 같은
// 상품 상세 화면이라 이 훅 하나를 그 화면이 부른다. 기록은 효과(effect) 안에서만 한다: 서버에서
// 그리는 동안 부르면 여러 사용자가 나눠 쓰는 서버 모듈에 기록이 섞인다.

import { useEffect } from "react";

import { useRecentlyViewedStore } from "./recently-viewed-store";

export function useRecordRecentlyViewed(productId: number) {
  const record = useRecentlyViewedStore((state) => state.record);

  useEffect(() => {
    record(productId);
  }, [productId, record]);
}
