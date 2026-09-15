// 알림 상세 모달. 공지는 닫기만, 배송 알림은 확인으로 이어진다.
// UI 시안 기준(noti_011, 1568-82262 공지·1568-82391 알림)이다. 카드 모서리 16, 제목 title/bold_18, 본문 body/medium_14, 버튼 40.

import { Badge } from "@/shared/ui/badge/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import {
  NOTIFICATION_KIND_LABEL,
  NOTIFICATION_KIND_TONE,
  type NotificationItem,
} from "./notification-row";

type NotificationDialogProps = {
  item: NotificationItem | null;
  onOpenChange: (open: boolean) => void;
  /** 배송 알림에서 주문을 보러 간다. 없으면 그 버튼을 그리지 않는다. */
  onConfirm?: () => void;
};

/** 시안 dialog의 action_button. 40px에 굵은 14px */
const ACTION_CLASS = "h-10 flex-1 text-label-bold-14";

export function NotificationDialog({ item, onOpenChange, onConfirm }: NotificationDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4 rounded-2xl">
        <DialogHeader className="gap-2">
          {item && (
            <Badge tone={NOTIFICATION_KIND_TONE[item.kind]} className="w-fit">
              {NOTIFICATION_KIND_LABEL[item.kind]}
            </Badge>
          )}
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-left text-title-bold-18 text-foreground">
              {item?.title}
            </DialogTitle>
            <DialogDescription className="text-left text-body-medium-14 whitespace-pre-line text-text-body-secondary">
              {item?.body}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* shadcn DialogFooter는 회색 띠를 두르는데 시안에는 없어 맨 줄로 둔다 */}
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className={ACTION_CLASS}>
              닫기
            </Button>
          </DialogClose>
          {/* 배송 알림에만 이어지는 곳이 있다 */}
          {onConfirm && (
            <Button className={ACTION_CLASS} onClick={onConfirm}>
              배송 확인
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
