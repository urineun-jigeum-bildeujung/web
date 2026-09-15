// 배송 조회 준비중 안내. 택배사 연동 전까지 `배송 위치 보기`가 여는 모달이다.
//
// 시안에는 없는 화면이다. 시안(mypa_061)은 버튼을 활성으로 그렸는데 갈 곳이 아직 없어,
// 눌리지 않게 잠가 두는 대신 왜 지금은 안 되는지 알리기로 했다 (#201).
// 모양은 알림 상세 모달(noti_011)을 따른다 — 모서리 16, 제목 title/bold_18, 버튼 40.

import { APP_MESSAGE, APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

const MESSAGE = APP_MESSAGE[APP_MESSAGE_CODE.order.deliveryTrackingPreparing];

type DeliveryTrackingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeliveryTrackingDialog({ open, onOpenChange }: DeliveryTrackingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4 rounded-2xl">
        <DialogHeader className="gap-1">
          {/* DialogTitle이 `font-medium`을 들고 있어 토큰의 굵기가 죽는다. 따로 되돌린다 */}
          <DialogTitle className="text-left text-title-bold-18 font-bold text-foreground">
            {MESSAGE.title}
          </DialogTitle>
          <DialogDescription className="text-left text-body-medium-14 text-text-body-secondary">
            {MESSAGE.description}
          </DialogDescription>
        </DialogHeader>

        {/* shadcn DialogFooter는 회색 띠를 두르는데 안내 하나뿐이라 맨 줄로 둔다 */}
        <DialogClose asChild>
          <Button className="h-10 w-full text-label-bold-14 font-bold">확인</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
