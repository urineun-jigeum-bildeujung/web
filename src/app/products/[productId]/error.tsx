"use client";
// 상품 상세 라우트가 통째로 실패했을 때 그 자리에 뜬다. 머리말을 함께 그려 돌아갈 길을 남긴다 (#620).
//
// **전역 `app/error.tsx`에는 머리말이 없다.** 이 프로젝트는 머리말과 하단 이동 줄을 화면이 직접
// 그리므로, 라우트가 실패하면 그 둘이 통째로 사라져 눌러 갈 링크가 하나도 남지 않는다. 상품
// 상세는 비로그인도 보는 공개 화면이고 메인·검색에서 들어오는 자리라 거기서 갇히면 안 된다.
//
// **이 라우트는 여기서만 잡을 수 있다.** 상세는 라우트가 상품을 `await`한다 — 없는 상품을 404로
// 보내는 `notFound()`를 렌더 중에 불러야 해서다. 뷰가 그려지기 전에 터지므로 뷰 안의 구역
// 경계로는 잡히지 않는다(검색 결과는 뷰에서 `use()`로 읽어 구역 경계로 잡는다).
//
// 머리말을 그대로 쓸 수 있는 것은 이 화면의 `PageHeader`가 상품 값을 하나도 쓰지 않기 때문이다 —
// 뒤로가기·알림·장바구니뿐이다. 기본 뒤로가기는 되돌릴 기록이 없으면 홈으로 가므로(`page-header`),
// 공유 링크로 바로 들어와 실패해도 나갈 길이 있다.
//
// 문구는 전역과 같은 `common.routeError`다. 화면마다 다른 말을 만들지 않는다(app-message-convention).

import { useEffect } from "react";

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { reportError } from "@/shared/lib/report-error";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { CartLink } from "@/widgets/cart-link";
import { NotificationBell } from "@/widgets/notification-bell";

const MESSAGE = APP_MESSAGE[APP_MESSAGE_CODE.common.routeError];

export default function ProductDetailError({ error, reset }: { error: Error; reset: () => void }) {
  // 사용자에게는 고정 문구만 보이고 원인은 reportError로만 남긴다(전역 오류 화면과 같다).
  useEffect(() => {
    reportError("product detail route error", error);
  }, [error]);

  return (
    // 이 라우트는 `(constrained)` 밖이라 폭을 스스로 진다. 상세 본체와 같은 기둥이다(#497).
    <div className="mx-auto flex min-h-dvh w-full max-w-300 flex-col">
      {/* 상세 본체(`views/product-detail`)의 머리말과 같은 구성이다 */}
      <PageHeader
        right={
          <>
            <NotificationBell />
            <CartLink />
          </>
        }
      />

      {/* 본문 랜드마크는 실패했을 때도 둔다 — 낭독기가 머리말을 지나 본문으로 건너뛸 수 있어야 한다.
          `role="alert"`은 안쪽 div가 진다. main에 얹으면 본문 랜드마크가 사라진다 */}
      <main className="flex flex-1 flex-col">
        {/* 전역 오류 화면과 같은 간격이다 — 그림에서 제목까지 28, 제목에서 설명까지 16, 설명에서 버튼까지 40 */}
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center px-5 text-center"
        >
          {/* 디자인 시스템 `icon_reload`. 시안이 102px이라 세트 기본(24)에서 키운다 */}
          <Icon name="reload" className="size-25.5 text-icon-fill-light-red" />

          <p className="mt-7 text-title-bold-20 text-foreground">{MESSAGE.title}</p>
          <p className="mt-4 text-body-medium-14 whitespace-pre-line text-text-body-secondary">
            {MESSAGE.description}
          </p>

          <Button onClick={reset} variant="secondary" className="mt-10 min-h-11 px-4">
            <Icon name="reload" />
            다시 시도하기
          </Button>
        </div>
      </main>
    </div>
  );
}
