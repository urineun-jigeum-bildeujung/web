// 최근 본 상품 번호를 읽는 훅. 하이드레이션이 끝나기 전에는 준비되지 않았다고 알린다 (#509).

import { useSyncExternalStore } from "react";

import { useRecentlyViewedStore } from "./recently-viewed-store";

const subscribeHydration = (onChange: () => void) =>
  useRecentlyViewedStore.persist.onFinishHydration(onChange);
const isHydrated = () => useRecentlyViewedStore.persist.hasHydrated();
/** 서버에는 저장소가 없어 목록을 모른다 */
const isHydratedOnServer = () => false;

export function useRecentlyViewed() {
  // **하이드레이션 중에는 서버와 같게 그린다.** 서버 화면은 늘 빈 목록인데 브라우저의 스토어는 만들
  // 때 이미 복원돼 있어, 곧바로 목록을 그리면 서버 HTML과 어긋난다. 서버 스냅숏(false)으로 한 번 그린
  // 뒤 바로 true로 다시 그린다
  const ready = useSyncExternalStore(subscribeHydration, isHydrated, isHydratedOnServer);
  const productIds = useRecentlyViewedStore((state) => state.productIds);
  const remove = useRecentlyViewedStore((state) => state.remove);

  return {
    productIds: ready ? productIds : [],
    /** 저장된 목록을 읽었는지. 거짓인 동안은 목록이 비어 보여도 아직 모르는 것이다 */
    ready,
    remove,
  };
}
