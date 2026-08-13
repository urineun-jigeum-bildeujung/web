"use client";
// 다크 모드를 켜고 끄는 데모 토글 버튼. 선택 저장·시스템 테마 연동은 정식 테마 도구 도입 시점에 결정한다.

import { useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

import { Button } from "@/shared/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  const handleToggle = () => {
    const next = !isDark;
    setIsDark(next);
    // 다크 모드는 html의 .dark 클래스로 동작한다. (globals.css의 @custom-variant dark)
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDark ? <LuSun aria-hidden /> : <LuMoon aria-hidden />}
    </Button>
  );
}
