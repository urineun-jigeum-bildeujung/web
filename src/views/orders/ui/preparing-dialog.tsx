// 갈 곳이 아직 없는 버튼이 여는 준비 중 안내. 목록의 `배송 위치 보기`와 `장바구니 담기`가 연다.
//
// 시안에는 없는 화면이다. 시안(mypa_061)은 두 버튼을 활성으로 그렸는데 갈 곳이 아직 없어,
// 눌리지 않게 잠가 두는 대신 왜 지금은 안 되는지 알리기로 했다.
//
// - `배송 위치 보기` — 택배사 연동이 정해지지 않았다 (#201)
// - `장바구니 담기` — 주문 응답에 상품 ID·`itemType`이 없어 담기 요청을 만들 수 없다.
//   팀장 결정(2026-09-23)으로 버튼은 두고 안내만 띄운다 (#405)
//
// 모양은 알림 상세 모달(noti_011)을 따른다 — 모서리 16, 제목 title/bold_18, 버튼 40.

import { APP_MESSAGE, type AppMessage, type AppMessageCode } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type PreparingDialogProps = {
  /** 띄울 안내. `null`이면 닫혀 있다 */
  code: AppMessageCode | null;
  onClose: () => void;
};

export function PreparingDialog({ code, onClose }: PreparingDialogProps) {
  const message: AppMessage | null = code ? APP_MESSAGE[code] : null;

  return (
    <Dialog open={message !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="gap-4 rounded-2xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-left text-title-bold-18 text-foreground">
            {message?.title}
          </DialogTitle>
          <DialogDescription className="text-left text-body-medium-14 break-keep text-text-body-secondary">
            {message?.description}
          </DialogDescription>
        </DialogHeader>

        {/* shadcn DialogFooter는 회색 띠를 두르는데 안내 하나뿐이라 맨 줄로 둔다 */}
        <DialogClose asChild>
          <Button className="h-10 w-full text-label-bold-14">확인</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
