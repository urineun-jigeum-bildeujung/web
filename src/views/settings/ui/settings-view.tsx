// 설정. 알림·테마와 계정 관련 항목을 모은다.
// UI 시안 기준(mypa_081, 1117-7999)이다. 줄 높이 40, 아이콘 24, 제목 label/bold_14, 줄 사이 12px.
//
// 시안은 네 줄 다 화살표인데 갈 곳이 있는 줄이 없다. 갈 곳이 없는 줄은 화살표 없는 정적 줄로 둔다(#194의 선례).
// 알림설정은 하위 화면 시안이 없어 줄 오른쪽에 스위치를 둔다.
//
// 로그아웃만 그 자리에서 동작하는 줄이다(#247). 회원탈퇴는 API가 아직 없어 정적 줄로 남는다.

"use client";

import { useId, useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";

import { Icon } from "@/shared/ui/icon/icon";
import { ListRowButton, ListRowStatic } from "@/shared/ui/list-row/list-row";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Switch } from "@/shared/ui/switch";

import { useMutateLogout } from "../api/use-mutate-logout";

export function SettingsView() {
  const pushId = useId();
  const [pushEnabled, setPushEnabled] = useState(true);
  const { logout, isLoggingOut } = useMutateLogout();

  // 실패해도 기기의 토큰은 지워져 로그아웃은 끝난다. 서버 정리가 안 됐다는 것만 알린다
  const signOut = () => {
    logout().catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="설정" />

      <main className="flex flex-1 flex-col gap-3 pt-4 pb-8">
        {/* 행을 버튼으로 만들면 스위치(버튼)가 버튼 안에 들어가 HTML이 깨진다.
            레이블로 감싸 행 어디를 눌러도 스위치가 눌리게 한다. 모양은 ListRow sm과 같다 */}
        <label
          htmlFor={pushId}
          className="flex min-h-10 cursor-pointer items-center gap-2 px-5 transition-colors hover:bg-muted"
        >
          <Icon name="bell_fill" className="size-6 shrink-0 text-icon-fill-accent" />
          <span className="flex-1 text-label-bold-14 text-foreground">알림설정</span>
          <Switch id={pushId} checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </label>
        <ListRowStatic size="sm" title="테마설정" icon={<Icon name="mode" />} />
        <ListRowButton
          size="sm"
          hideChevron
          disabled={isLoggingOut}
          onClick={signOut}
          title={<LoadingSwap loading={isLoggingOut}>로그아웃</LoadingSwap>}
          icon={<Icon name="key" className="text-icon-fill-purple" />}
        />
        <ListRowStatic size="sm" title="회원탈퇴" icon={<Icon name="user" />} />
      </main>
    </div>
  );
}
