// 최근 본 상품을 이 브라우저에 남기는 스토어. 백엔드 API가 없어 프론트가 기록한다 (#509).
//
// **상품 번호만 남긴다.** 이름·가격 같은 서버 값은 복사하지 않고, 목록을 그리는 쪽이 상품 조회로
// 받는다 — 복사해 두면 가격이 바뀌어도 옛 값이 남는다(AGENTS 5.1).
//
// 저장은 localStorage(`persist`)다. 서버에는 localStorage가 없어 서버에서 그린 화면은 늘 빈 목록이고,
// 브라우저에서는 스토어를 만들 때 바로 복원된다. 그래서 읽는 쪽은 하이드레이션이 끝난 뒤에만 목록을
// 그린다(`use-recently-viewed.ts`).

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** 와이어프레임 명세(73:2245)의 "최근 본 상품(최대 9개)" */
export const RECENTLY_VIEWED_LIMIT = 9;

type RecentlyViewedState = {
  /** 본 순서. 맨 앞이 방금 본 상품이다(PRD "정렬 기준: 최신순") */
  productIds: number[];
  /** 본 상품을 맨 앞에 둔다. 이미 있던 상품이면 자리를 옮기고, 넘치면 가장 오래된 것부터 뺀다 */
  record: (productId: number) => void;
  remove: (productId: number) => void;
};

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      record: (productId) =>
        set((state) =>
          // 같은 상품을 연달아 보면 바뀌는 것이 없다. 새 배열을 만들지 않아 저장도 다시 하지 않는다
          state.productIds[0] === productId
            ? state
            : {
                productIds: [productId, ...state.productIds.filter((id) => id !== productId)].slice(
                  0,
                  RECENTLY_VIEWED_LIMIT,
                ),
              },
        ),
      remove: (productId) =>
        set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),
    }),
    {
      name: "gollaju.recentlyViewed",
      storage: createJSONStorage(() => localStorage),
      // 함수는 저장하지 않는다. 번호 목록만 남긴다
      partialize: (state) => ({ productIds: state.productIds }),
      version: 1,
    },
  ),
);
