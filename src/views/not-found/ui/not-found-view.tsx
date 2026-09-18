// 없는 주소로 들어왔을 때 보이는 화면. UI 시안 기준(404 2115:171082)이다.
//
// **헤더도 하단 바도 없다.** 길을 잃은 자리라 다른 데로 가는 길을 버튼 하나로만 준다.
//
// 시안 색은 둘 다 토큰과 값이 정확히 같아 그대로 옮겼다 — 그림 `#FFB3B1`이
// `icon-fill-light-red`, 버튼 바닥 `#EEEFF1`이 `surface-secondary`다.

import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";

export function NotFoundView() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      {/* 디자인 시스템 `icon_404`. 시안이 102px이라 세트 기본(24)에서 키운다 */}
      <Icon name="404" className="size-25.5 text-icon-fill-light-red" />

      {/* 시안 간격 — 그림에서 제목까지 28, 제목에서 설명까지 16, 설명에서 버튼까지 40 */}
      <h1 className="mt-7 text-title-bold-20 text-foreground">앗, 길을 잘못 드신 것 같아요</h1>
      <p className="mt-4 text-body-medium-14 text-text-body-secondary">
        찾으시는 페이지의 주소가 바뀌었거나 사라졌어요
        <br />
        제가 다시 홈으로 안전하게 안내해 드릴게요
      </p>

      {/* 시안 문구가 "제가 다시 홈으로 안내해 드릴게요"라 뒤로가 아니라 홈으로 보낸다 */}
      <Button asChild variant="secondary" className="mt-10 min-h-11 w-full">
        <Link href="/">돌아가기</Link>
      </Button>
    </main>
  );
}
