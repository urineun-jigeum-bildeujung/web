// 헤더의 종. 읽지 않은 알림이 있으면 오른쪽 위에 브랜드색 점을 붙인다.
// 다섯 헤더(홈·상품 상세·찜·비교·마이페이지)가 각자 그리던 종 링크를 이것 하나로 쓴다(#395).
// 슬롯 크기와 누르는 자리는 머리말 공용 슬롯(`HeaderIconLink`)을 따른다 (#513).
// 비로그인이 누르면 알림 화면으로 가지 않고 로그인 필요 토스트만 띄운다 (#542).

"use client";

import { useQueryUnreadNotificationCount } from "@/entities/notification";
import { useRequireSession } from "@/shared/api/use-require-session";
import { HeaderIconLink } from "@/shared/ui/page-header/header-icon-link";

export function NotificationBell() {
  const unread = useQueryUnreadNotificationCount();
  const requireSession = useRequireSession();

  return (
    <HeaderIconLink
      href="/mypage/notifications"
      label="알림"
      icon="bell"
      onClick={(event) => {
        if (!requireSession()) event.preventDefault();
      }}
      badge={
        unread > 0 && (
          <span
            aria-hidden
            className="absolute top-0 right-0 size-1.5 rounded-full bg-surface-brand"
          />
        )
      }
    >
      {/* 점만으로는 무엇인지 알 수 없어 읽히는 문장을 함께 둔다. 아이 관리 탭의 점(#345)과 같은 모양 */}
      {unread > 0 && <span className="sr-only">(읽지 않은 알림 {unread}개)</span>}
    </HeaderIconLink>
  );
}
