// 최근 본 상품을 이 브라우저에 남기는 스토어. 백엔드 API가 없어 프론트가 기록한다 (#509).
//
// **상품 번호만 남긴다.** 이름·가격 같은 서버 값은 복사하지 않고, 목록을 그리는 쪽이 상품 조회로
// 받는다 — 복사해 두면 가격이 바뀌어도 옛 값이 남는다(AGENTS 5.1).
//
// 저장은 localStorage(`persist`)다. 서버에는 localStorage가 없어 서버에서 그린 화면은 늘 빈 목록이고,
// 브라우저에서는 스토어를 만들 때 바로 복원된다. 그래서 읽는 쪽은 하이드레이션이 끝난 뒤에만 목록을
// 그린다(`use-recently-viewed.ts`).

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

/** 와이어프레임 명세(73:2245)의 "최근 본 상품(최대 9개)" */
export const RECENTLY_VIEWED_LIMIT = 9;

/**
 * 저장을 막아 둔 브라우저(사이트 데이터 차단)나 용량이 찬 저장소에서도 화면은 돈다. 기록만 남지 않는다.
 * 그대로 두면 상품 상세가 기록하다 예외로 죽고, 접근부터 막힌 곳에서는 `persist`가 아예 생기지 않는다
 */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // 기록을 남기지 못해도 보던 화면을 막을 이유는 없다
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // 위와 같다
    }
  },
};

/**
 * 저장된 값은 한 칸씩 확인해 옮긴다. 손으로 고쳤거나 형식이 바뀐 값이 통째로 들어오면, 숫자가 아닌 번호는
 * 404가 아닌 400으로 실패해 기록에서 영영 빠지지 않고 같은 번호는 카드 키가 겹친다
 */
function toProductIds(persisted: unknown): number[] {
  const saved =
    typeof persisted === "object" && persisted !== null && "productIds" in persisted
      ? persisted.productIds
      : undefined;
  if (!Array.isArray(saved)) return [];

  const ids = saved.filter((id): id is number => Number.isSafeInteger(id) && id > 0);
  return [...new Set(ids)].slice(0, RECENTLY_VIEWED_LIMIT);
}

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
      storage: createJSONStorage(() => safeLocalStorage),
      // 함수는 저장하지 않는다. 번호 목록만 남긴다
      partialize: (state) => ({ productIds: state.productIds }),
      merge: (persisted, current) => ({ ...current, productIds: toProductIds(persisted) }),
      version: 1,
    },
  ),
);
