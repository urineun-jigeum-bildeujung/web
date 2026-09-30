"use client";
// 설정 화면의 테마설정 스위치. 켜면 다크 모드다 (#565).

import { Switch } from "@/shared/ui/switch";

import { useDarkMode } from "../model/use-dark-mode";

/** 줄 전체를 레이블로 감싸는 쪽이 `id`를 넘긴다. 스위치에는 보이는 글자가 없다 */
export function ThemeSwitch({ id }: { id: string }) {
  const { isDark, ready, setDark } = useDarkMode();

  return <Switch id={id} checked={isDark} disabled={!ready} onCheckedChange={setDark} />;
}
