// 설정. 알림·테마와 계정 관련 항목을 모은다.
// UI 시안 기준(mypa_081, 1117-7999)이다. 줄 높이 40, 아이콘 24, 제목 label/bold_14, 줄 사이 12px.
//
// 시안은 네 줄 다 화살표인데 갈 곳이 있는 줄이 없다. 갈 곳이 없는 줄은 화살표 없는 정적 줄로 둔다(#194의 선례).
// 알림설정은 하위 화면 시안이 없어 줄 오른쪽에 스위치를 둔다. 스위치의 뜻은 "이 기기의 푸시 허용"이다(#354).
//
// 로그아웃과 회원탈퇴가 그 자리에서 동작하는 줄이다(#247, #266). 테마설정만 정적 줄로 남는다.

"use client";

import { useId, useState } from "react";

import { useMutateWithdraw } from "@/entities/member";

import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";

import { Icon } from "@/shared/ui/icon/icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { ListRowButton, ListRowStatic } from "@/shared/ui/list-row/list-row";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Switch } from "@/shared/ui/switch";

import { useMutateLogout } from "../api/use-mutate-logout";
import { useMutatePushSetting } from "../api/use-mutate-push-setting";

export function SettingsView() {
  const pushId = useId();
  const {
    enabled: pushEnabled,
    supported: pushSupported,
    isChanging: pushChanging,
    setPushEnabled,
  } = useMutatePushSetting();
  const { logout, isLoggingOut } = useMutateLogout();
  const { withdraw, isWithdrawing } = useMutateWithdraw();
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  // 실패해도 기기의 토큰은 지워져 로그아웃은 끝난다. 서버 정리가 안 됐다는 것만 알린다
  const signOut = () => {
    logout().catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  // **탈퇴는 실패하면 아무것도 지우지 않는다.** 계정이 살아 있는데 토큰만 비우면
  // 쫓겨난 채로 탈퇴됐는지도 알 수 없다. 로그아웃과 다른 점이다
  const leave = () => {
    withdraw().catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
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
          {/* 권한을 묻고 서버에 알리는 동안 아이콘 자리에 대기 표시. 스위치는 라벨이 없어 여기서 보인다 */}
          <LoadingSwap loading={pushChanging} label="알림 설정을 바꾸는 중">
            <Icon name="bell_fill" className="size-6 shrink-0 text-icon-fill-accent" />
          </LoadingSwap>
          <span className="flex flex-1 flex-col text-label-bold-14 text-foreground">
            알림설정
            {/* 서비스 워커·알림 API가 없거나 Firebase 설정이 빈 환경. 켤 수 없는 까닭을 보인다 */}
            {!pushSupported && (
              <span className="text-caption-regular-13 font-normal text-text-body-tertiary">
                이 환경에서는 켤 수 없어요
              </span>
            )}
          </span>
          <Switch
            id={pushId}
            checked={pushEnabled}
            disabled={!pushSupported || pushChanging}
            onCheckedChange={setPushEnabled}
          />
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
        <ListRowButton
          size="sm"
          hideChevron
          disabled={isWithdrawing}
          onClick={() => setConfirmingWithdraw(true)}
          title={<LoadingSwap loading={isWithdrawing}>회원탈퇴</LoadingSwap>}
          icon={<Icon name="user" />}
        />
      </main>

      {/* 탈퇴는 되돌릴 수 없다. 한 번 묻고 보낸다 */}
      <AlertDialog open={confirmingWithdraw} onOpenChange={setConfirmingWithdraw}>
        <AlertDialogContent>
          <AlertDialogTitle>정말 탈퇴하시겠어요?</AlertDialogTitle>
          <AlertDialogDescription>
            등록한 아이 정보와 주문 내역이 모두 사라지고 되돌릴 수 없어요.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">닫기</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={leave}>
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
