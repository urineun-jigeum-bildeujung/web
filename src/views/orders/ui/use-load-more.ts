// 목록 끝이 화면에 들어오면 다음 쪽을 부르는 훅.
//
// **"더보기" 버튼 대신 스크롤로 잇는다.** 시안(mypa_061)에 버튼 자리가 없어서다. 버튼을
// 만들어 넣으면 시안에 없는 것을 늘리게 되고, 그대로 두면 열한 번째 주문부터 볼 길이 없다.
//
// **두 번째 쓰임이 생기면 `shared/lib`로 올린다.** 지금은 주문 목록 하나뿐이라 여기 둔다.

"use client";

import { useEffect, useRef } from "react";

/**
 * 돌려주는 ref를 목록 맨 아래 빈 요소에 건다.
 *
 * `enabled`가 거짓이면 관찰하지 않는다 — 더 가져올 것이 없거나 이미 가져오는 중일 때
 * 계속 보고 있으면 같은 요청이 겹쳐 나간다.
 */
export function useLoadMore(onVisible: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target || !enabled) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onVisible();
      }
    });
    observer.observe(target);

    return () => observer.disconnect();
  }, [enabled, onVisible]);

  return ref;
}
