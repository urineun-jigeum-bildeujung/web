// 알림 상세 모달. 공지는 닫기만, 배송 알림은 확인으로 이어진다.
// 와이어프레임 기준(noti_001_공지, noti_001_알림)이라 디자인 확정 시 바뀔 수 있다.

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { NOTIFICATION_KIND_LABEL, type NotificationItem } from "./notification-row";

type NotificationDialogProps = {
  item: NotificationItem | null;
  onOpenChange: (open: boolean) => void;
  /** 배송 알림에서 주문을 보러 간다. 없으면 그 버튼을 그리지 않는다. */
  onConfirm?: () => void;
};

export function NotificationDialog({ item, onOpenChange, onConfirm }: NotificationDialogProps) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader className="gap-2">
          {item && (
            <span className="w-fit rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
              {NOTIFICATION_KIND_LABEL[item.kind]}
            </span>
          )}
          <DialogTitle className="text-left text-base">{item?.title}</DialogTitle>
          <DialogDescription className="text-left text-sm whitespace-pre-line">
            {item?.body}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row gap-2 sm:justify-stretch">
          <DialogClose asChild>
            <Button variant="secondary" className="min-h-11 flex-1">
              닫기
            </Button>
          </DialogClose>
          {/* 배송 알림에만 이어지는 곳이 있다 */}
          {onConfirm && (
            <Button className="min-h-11 flex-1" onClick={onConfirm}>
              배송 확인
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
