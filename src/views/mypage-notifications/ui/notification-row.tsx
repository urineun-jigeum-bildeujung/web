// 알림 목록 한 줄. 유형 뱃지·제목·날짜·본문 미리보기를 보여준다.
// 와이어프레임 기준(noti_001)이라 디자인 확정 시 바뀔 수 있다.

import { cn } from "@/shared/lib/utils";

export const NOTIFICATION_KINDS = ["notice", "alarm"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  notice: "공지",
  alarm: "알림",
};

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  date: string;
  /** 아직 열어보지 않은 것 */
  unread: boolean;
};

type NotificationRowProps = {
  item: NotificationItem;
  onSelect: () => void;
};

export function NotificationRow({ item, onSelect }: NotificationRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
        "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      <span className="flex items-center gap-2">
        <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
          {NOTIFICATION_KIND_LABEL[item.kind]}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {item.title}
          {/* 점만으로는 무엇인지 알 수 없어 읽히는 문장을 함께 둔다 */}
          {item.unread && (
            <>
              <span aria-hidden className="ml-1 text-destructive">
                ●
              </span>
              <span className="sr-only"> 읽지 않음</span>
            </>
          )}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{item.date}</span>
      </span>
      <span className="truncate text-xs text-muted-foreground">{item.body}</span>
    </button>
  );
}
