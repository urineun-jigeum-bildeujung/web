// 다크 모드를 켰는지 읽고 바꾼다. 선택은 next-themes가 기기(localStorage)에 남긴다 (#565).

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

export function useDarkMode() {
  const { resolvedTheme, setTheme } = useTheme();
  // 서버는 저장된 선택을 모른다. 하이드레이션이 끝나기 전에 저장값으로 그리면 서버가 그린 것과 어긋나므로
  // 그때까지는 꺼짐으로 보이고 바꿀 수 없게 한다
  const ready = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return {
    isDark: ready && resolvedTheme === "dark",
    ready,
    setDark: (dark: boolean) => setTheme(dark ? "dark" : "light"),
  };
}
