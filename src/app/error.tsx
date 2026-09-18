"use client";
// 화면 하나가 통째로 실패했을 때 그 자리에 뜬다. 헤더·하단바는 살아 있고 이 영역만 바뀐다.
// UI 시안 기준(mypa_021 2115:171148)이고 404와 같은 레이아웃이다.
//
// 섹션 하나가 실패한 것이면 ErrorBoundary가 먼저 잡는다. 여기까지 왔다는 것은
// 화면을 그릴 수 없다는 뜻이다.
//
// **버튼이 "다시 시도하기" 하나뿐인 것은 시안 그대로다.** 헤더와 하단 탭이 살아 있어
// 홈으로 나가는 길은 남아 있으므로 갇히지 않는다.

import { useEffect } from "react";
import { IoReloadCircle } from "react-icons/io5";

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { reportError } from "@/shared/lib/report-error";
import { Button } from "@/shared/ui/button";

const MESSAGE = APP_MESSAGE[APP_MESSAGE_CODE.common.routeError];

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // 사용자에게는 고정 문구만 보이고 원인은 reportError로만 남긴다.
  useEffect(() => {
    reportError("route error", error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center px-5 text-center">
      {/* 시안 `ion:reload-circle` 102px. `shared/ui/icon` 세트 밖이라 react-icons로 보충한다 */}
      <IoReloadCircle aria-hidden className="size-25.5 text-icon-fill-light-red" />

      {/* 시안 간격 — 그림에서 제목까지 28, 제목에서 설명까지 16, 설명에서 버튼까지 40 */}
      <p className="mt-7 text-title-bold-20 text-foreground">{MESSAGE.title}</p>
      <p className="mt-4 text-body-medium-14 whitespace-pre-line text-text-body-secondary">
        {MESSAGE.description}
      </p>

      <Button onClick={reset} variant="secondary" className="mt-10 min-h-11 px-4">
        <IoReloadCircle aria-hidden />
        다시 시도하기
      </Button>
    </div>
  );
}
