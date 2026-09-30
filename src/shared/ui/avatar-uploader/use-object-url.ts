// 사진 한 장의 미리보기 주소(blob:)를 만들어 주고, 파일이 바뀌거나 화면에서 빠지면 거둔다.
//
// **useSyncExternalStore로 든다.** 주문 취소·반품의 `useObjectUrls`(#409 리뷰)와 같은 까닭이다.
// 렌더에서 만들고 effect 정리에서 거두면, 개발 모드 StrictMode가 effect를 정리→다시 실행할 때 거둔
// 주소만 남아 미리보기가 깨진다. effect 안에서 만들어 state에 넣으면 `react-hooks/set-state-in-effect`에
// 걸린다. 구독을 붙일 때 만들고 뗄 때 거두면, 다시 붙을 때 새로 만든 주소를 React가 다시 읽는다.

import { useMemo, useSyncExternalStore } from "react";

function createUrlStore(file: File | null) {
  let url: string | null = null;

  return {
    subscribe(onChange: () => void) {
      if (!file) return () => {};
      const created = URL.createObjectURL(file);
      url = created;
      // 렌더 때 읽은 빈 값과 달라졌다고 알려 새 주소로 다시 그리게 한다
      onChange();
      return () => {
        URL.revokeObjectURL(created);
        url = null;
      };
    },
    getSnapshot: () => url,
  };
}

/** 파일의 미리보기 주소. 파일이 없으면 `null`이고, 처음 한 번도 `null`이다 */
export function useObjectUrl(file: File | null): string | null {
  // React Compiler가 있어도 useMemo를 남긴다. 값을 아끼려는 것이 아니라 파일마다 저장소 하나를
  // 고정하려는 것이다 — 렌더마다 새로 만들면 구독이 매번 끊겨 주소를 다시 만든다
  const store = useMemo(() => createUrlStore(file), [file]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}
