// 알림 목록 한 줄. 유형 배지·제목·날짜·본문 미리보기를 보여준다.
// UI 시안 기준(noti_011, 1568-81466)이다. 배지 4px 모서리, 제목 title/bold_16, 날짜 caption 12, 본문 body/regular_13.

import { Badge } from "@/shared/ui/badge/badge";

export const NOTIFICATION_KINDS = ["notice", "alarm"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  notice: "공지",
  alarm: "알림",
};

/** 배지 색. 공지는 회색, 알림은 파랑이다 */
export const NOTIFICATION_KIND_TONE = {
  notice: "default",
  alarm: "info",
} as const;

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
    // 시안의 줄 사이 12px은 위아래 6px씩 줄이 갖는다. 호버 배경이 그만큼 넓어진다
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col gap-2 px-5 py-1.5 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex w-full items-end justify-between gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Badge tone={NOTIFICATION_KIND_TONE[item.kind]}>
            {NOTIFICATION_KIND_LABEL[item.kind]}
          </Badge>
          <span className="min-w-0 truncate text-title-bold-16 text-foreground">{item.title}</span>
          {/* 점만으로는 무엇인지 알 수 없어 읽히는 문장을 함께 둔다 */}
          {item.unread && (
            <>
              <span
                aria-hidden
                className="mt-0.5 size-1.25 shrink-0 self-start rounded-full bg-surface-brand"
              />
              <span className="sr-only">읽지 않음</span>
            </>
          )}
        </span>
        <span className="shrink-0 text-caption-regular-12 text-text-body-secondary">
          {item.date}
        </span>
      </span>
      <span className="w-full truncate text-body-regular-13 text-text-body-secondary">
        {item.body}
      </span>
    </button>
  );
}
