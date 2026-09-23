// 파일마다 미리보기 주소(blob:)를 만들어 주고, 화면에서 빠지면 거둔다.
//
// **useSyncExternalStore로 든다.** 주소는 브라우저 자원이라 만든 만큼 거둬야 한다. 렌더에서
// 만들고 effect 정리에서 거두면, 개발 모드 StrictMode가 effect를 정리→다시 실행할 때 거둔
// 주소만 남아 늦게 불리는 이미지가 깨진다(#409 리뷰). effect 안에서 만들어 state에 넣으면
// `react-hooks/set-state-in-effect`에 걸린다. 구독을 붙일 때 만들고 뗄 때 거두면, 다시 붙을 때
// 새로 만든 주소를 React가 다시 읽는다.

import { useMemo, useSyncExternalStore } from "react";

const NONE: string[] = [];

function createUrlStore(files: File[]) {
  let urls = NONE;

  return {
    subscribe(onChange: () => void) {
      urls = files.map((file) => URL.createObjectURL(file));
      // 렌더 때 읽은 빈 목록과 달라졌다고 알려 새 주소로 다시 그리게 한다
      onChange();
      return () => {
        urls.forEach((url) => URL.revokeObjectURL(url));
        urls = NONE;
      };
    },
    getSnapshot: () => urls,
  };
}

/** 파일과 같은 순서의 미리보기 주소. 처음 한 번은 비어 있다 */
export function useObjectUrls(files: File[]): string[] {
  // React Compiler가 있어도 useMemo를 남긴다. 값을 아끼려는 것이 아니라 파일 목록마다 저장소
  // 하나를 고정하려는 것이다 — 렌더마다 새로 만들면 구독이 매번 끊겨 주소를 다시 만든다
  const store = useMemo(() => createUrlStore(files), [files]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => NONE);
}
