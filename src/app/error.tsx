"use client";
// 화면 하나가 통째로 실패했을 때 그 자리에 뜬다. 헤더·하단바는 살아 있고 이 영역만 바뀐다.
//
// 섹션 하나가 실패한 것이면 ErrorBoundary가 먼저 잡는다. 여기까지 왔다는 것은
// 화면을 그릴 수 없다는 뜻이라, 다시 시도와 홈으로 나가는 길을 함께 준다.

import Link from "next/link";
import { useEffect } from "react";

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
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-label-bold-16 text-foreground">{MESSAGE.title}</p>
        <p className="text-body-regular-14 text-muted-foreground">{MESSAGE.description}</p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="min-h-11 px-4" onClick={reset}>
          다시 시도
        </Button>
        <Button asChild className="min-h-11 px-4">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
