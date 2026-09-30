"use client";
// 다크 모드를 켜고 끄는 아이콘 버튼. 개발용 화면 목록에서 쓴다. 설정 화면은 `ThemeSwitch`를 쓴다.

import { LuMoon, LuSun } from "react-icons/lu";

import { Button } from "@/shared/ui/button";

import { useDarkMode } from "../model/use-dark-mode";

export function ThemeToggle() {
  const { isDark, ready, setDark } = useDarkMode();

  return (
    <Button
      variant="outline"
      size="icon"
      // shadcn의 icon 크기는 32px이라 터치 최소 44×44px에 못 미친다.
      // shared/ui는 CLI 소유라 호출부에서 덮는다. (design-convention)
      className="size-11"
      disabled={!ready}
      onClick={() => setDark(!isDark)}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDark ? <LuSun aria-hidden /> : <LuMoon aria-hidden />}
    </Button>
  );
}
