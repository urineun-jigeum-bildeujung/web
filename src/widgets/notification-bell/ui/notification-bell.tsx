// 헤더의 종. 읽지 않은 알림이 있으면 오른쪽 위에 브랜드색 점을 붙인다.
// 다섯 헤더(홈·상품 상세·찜·비교·마이페이지)가 각자 그리던 종 링크를 이것 하나로 쓴다(#395).

"use client";

import Link from "next/link";

import { useQueryUnreadNotificationCount } from "@/entities/notification";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type NotificationBellProps = {
  /** 링크 자리 모양. 기본은 보이는 28px에 안 보이는 터치 자리만 44px로 넓힌 헤더 아이콘 방식이다 */
  className?: string;
};

export function NotificationBell({ className }: NotificationBellProps) {
  const unread = useQueryUnreadNotificationCount();

  return (
    <Link
      href="/mypage/notifications"
      aria-label="알림"
      className={cn(
        "after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2",
        className,
      )}
    >
      <Icon name="bell" className="size-7" />
      {/* 점만으로는 무엇인지 알 수 없어 읽히는 문장을 함께 둔다. 아이 관리 탭의 점(#345)과 같은 모양 */}
      {unread > 0 && (
        <>
          <span
            aria-hidden
            className="absolute top-0 right-0 size-1.5 rounded-full bg-surface-brand"
          />
          <span className="sr-only">(읽지 않은 알림 {unread}개)</span>
        </>
      )}
    </Link>
  );
}
