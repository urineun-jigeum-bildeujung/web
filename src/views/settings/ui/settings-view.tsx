// 설정. 알림·테마와 계정 관련 행동을 모은다.
// 와이어프레임 기준(mypa_071)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useId, useState } from "react";
import {
  IoColorPaletteOutline,
  IoLogOutOutline,
  IoNotificationsOutline,
  IoPersonRemoveOutline,
} from "react-icons/io5";

import { ListRowButton } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Switch } from "@/shared/ui/switch";

export function SettingsView() {
  const pushId = useId();
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="설정" />

      <main className="flex flex-1 flex-col gap-6 pb-8">
        <section className="[&>*+*]:border-t [&>*+*]:border-border">
          {/* 행을 버튼으로 만들면 스위치(버튼)가 버튼 안에 들어가 HTML이 깨진다.
              레이블로 감싸 행 어디를 눌러도 스위치가 눌리게 한다. */}
          <label
            htmlFor={pushId}
            className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3"
          >
            <IoNotificationsOutline aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">알림 설정</span>
            <Switch id={pushId} checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </label>
          <ListRowButton title="테마 설정" icon={<IoColorPaletteOutline />} />
        </section>

        <section className="[&>*+*]:border-t [&>*+*]:border-border">
          <ListRowButton title="로그아웃" icon={<IoLogOutOutline />} />
          <ListRowButton title="회원탈퇴" icon={<IoPersonRemoveOutline />} />
        </section>
      </main>
    </div>
  );
}
