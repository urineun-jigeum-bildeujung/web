// 알림함. 내 알림 목록 조회와 읽음 처리.
//
// 백엔드는 최신순으로 쪽을 나눠 주지만 `hasNext`는 없다. 화면이 더보기를 붙일 때 다시 본다.

import { apiRequest } from "@/shared/api/client";

/** 백엔드 `NotificationDisplayType`. 화면은 `NOTICE`만 공지, 나머지는 알림으로 그린다 */
export type NotificationType =
  "NOTICE" | "DELIVERY" | "TIMEDEAL" | "STATUS_CHECK" | "RECOMMENDATION" | "RESTOCK";

/** 눌렀을 때 이어질 곳. 백엔드 `NotificationTargetType` */
export type NotificationTarget = {
  type: "PRODUCT" | "ORDER" | "TIMEDEAL";
  id: string;
};

/** 백엔드 `NotificationListResponse`와 같은 모양이다 */
type NotificationListResponse = {
  content: {
    notificationId: number;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    targetType: NotificationTarget["type"] | null;
    targetId: string | null;
    /** ISO 시각 */
    createdAt: string;
  }[];
};

/** 알림 한 건. 브라우저 전역 `Notification`과 이름이 겹쳐 `App`을 붙인다 */
export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  /** 이어질 곳이 없는 알림(공지 등)은 `null` */
  target: NotificationTarget | null;
  createdAt: string;
};

export function getNotifications(params: {
  page: number;
  size: number;
}): Promise<AppNotification[]> {
  return apiRequest<NotificationListResponse>("/notifications", { query: params }).then(
    (response) =>
      response.content.map((item) => ({
        id: String(item.notificationId),
        type: item.type,
        title: item.title,
        body: item.body,
        isRead: item.isRead,
        target:
          item.targetType !== null && item.targetId !== null
            ? { type: item.targetType, id: item.targetId }
            : null,
        createdAt: item.createdAt,
      })),
  );
}

export function markNotificationRead(notificationId: string): Promise<void> {
  return apiRequest<void>(`/notifications/${notificationId}/read`, { method: "PATCH" });
}
