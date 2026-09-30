// 장바구니에서 고른 줄을 이 브라우저에 남기는 스토어. 뒤로 갔다 오거나 탭을 닫았다 열어도 고른 것이 그대로다 (#563).
//
// **줄의 키(`cartItemKey`, `NORMAL:1`)만 남긴다.** 이름·가격·재고 같은 서버 값은 복사하지 않는다 —
// 복사하면 품절돼도 옛 값이 남고 캐시 무효화가 깨진다(AGENTS 5.1). 화면은 들어올 때마다 지금 장바구니의
// 살 수 있는 줄과 겹치는 키만 고른 것으로 본다. 빠진 줄·못 사게 된 줄의 키는 다음에 고를 때 걷힌다.
//
// 저장은 localStorage(`persist`)다. 서버에는 없어 서버 렌더에서는 늘 비어 있는데, 장바구니는 목록을
// 받은 뒤에야 고른 것을 그려 서버 HTML(뼈대)과 어긋나지 않는다.
//
// 저장소 감싸개와 복원 검증은 최근 본 상품(`features/recently-viewed`)과 같은 방식이다. 그쪽은
// features라 views가 가져다 쓸 수 없어 여기 따로 둔다.

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

/**
 * 저장을 막아 둔 브라우저(사이트 데이터 차단)나 용량이 찬 저장소에서도 화면은 돈다. 고른 것만 남지 않는다.
 * 그대로 두면 고르다 예외로 죽고, 접근부터 막힌 곳에서는 `persist`가 아예 생기지 않는다
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
      // 남기지 못해도 지금 화면에서 고르는 것은 막지 않는다
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
 * 저장된 값은 한 칸씩 확인해 옮긴다. 손으로 고쳤거나 형식이 바뀐 값이 통째로 들어오면 문자열이 아닌
 * 칸에서 `includes` 비교가 엉뚱하게 돌고, 같은 키가 겹치면 고른 개수가 부푼다
 */
function toKeys(persisted: unknown): string[] {
  const saved =
    typeof persisted === "object" && persisted !== null && "keys" in persisted
      ? persisted.keys
      : undefined;
  if (!Array.isArray(saved)) return [];

  return [...new Set(saved.filter((key): key is string => typeof key === "string"))];
}

type CartSelectionState = {
  /** 고른 줄의 키. 장바구니에서 빠진 줄의 키가 남아 있을 수 있어, 읽는 쪽이 지금 줄과 겹쳐 본다 */
  keys: string[];
  /** 고른 목록을 통째로 바꾼다. 부르는 쪽이 지금 줄과 겹친 목록에서 만들어 넘겨 남은 키가 걷힌다 */
  setKeys: (keys: string[]) => void;
};

export const useCartSelectionStore = create<CartSelectionState>()(
  persist(
    (set) => ({
      keys: [],
      setKeys: (keys) => set({ keys }),
    }),
    {
      name: "gollaju.cartSelection",
      storage: createJSONStorage(() => safeLocalStorage),
      // 함수는 저장하지 않는다. 키 목록만 남긴다
      partialize: (state) => ({ keys: state.keys }),
      merge: (persisted, current) => ({ ...current, keys: toKeys(persisted) }),
      version: 1,
    },
  ),
);
