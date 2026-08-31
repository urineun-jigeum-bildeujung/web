// 설정. 알림·테마와 계정 관련 행동을 모은다.
// 와이어프레임 기준(mypa_071)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useState } from "react";
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
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="설정" />

      <main className="flex flex-1 flex-col gap-6 pb-8">
        <section className="[&>*+*]:border-t [&>*+*]:border-border">
          {/* 토글은 그 자리에서 값이 바뀌므로 화살표를 숨기고 스위치를 오른쪽에 둔다 */}
          <ListRowButton
            title="알림 설정"
            icon={<IoNotificationsOutline />}
            hideChevron
            onClick={() => setPushEnabled((prev) => !prev)}
            trailing={
              <Switch
                checked={pushEnabled}
                aria-label="알림 설정"
                // 행 전체가 버튼이라 스위치는 표시만 맡는다
                tabIndex={-1}
                className="pointer-events-none"
              />
            }
          />
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
