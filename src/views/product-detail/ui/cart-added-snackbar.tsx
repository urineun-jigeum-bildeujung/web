// 상품 상세에서 장바구니에 담은 뒤 띄우는 스낵바. 방금 담은 것을 되돌리는 "담기 취소"가 붙는다 (#562).
//
// 시안(1702-18253)의 담김 스낵바는 문구뿐이다. 디자인 시스템 snackbar(information 324:5419)에 오른쪽
// 굵은 글자 버튼(`action`) 자리가 있어 그 모양을 쓴다 — 비교하기의 "확인하기"와 같은 방식이다.
// 버튼 문구와 되돌린 뒤의 안내는 시안에 없어 PD 확인 거리다.

import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { showSnackbar, SNACKBAR_CLASS, SNACKBAR_OPTIONS } from "@/shared/ui/snackbar/snackbar";

const ADDED = "상품이 장바구니에 담겼어요";

/**
 * 담김을 알린다. `undo`가 있으면 되돌리기 버튼을 단다.
 *
 * `undo`는 담기 전 수량을 알 때만 온다(`useMutateCartItem().add`). 모르면 되돌릴 기준이 없어 문구만
 * 띄운다. 되돌리기는 먼저 그리는 변경이라 기다리지 않는다 — 실패하면 훅이 캐시를 되돌리고 전역
 * MutationCache 토스트가 알린다 (AGENTS.md 5.8, app-message-convention).
 */
export function showCartAddedSnackbar(undo?: () => void) {
  if (!undo) {
    showSnackbar(ADDED);
    return;
  }

  toast.custom(
    (toastId) => (
      <div role="status" className={cn(SNACKBAR_CLASS, "justify-between gap-2")}>
        <span className="text-body-medium-14">{ADDED}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(toastId);
            undo();
            showSnackbar("장바구니 담기를 취소했어요");
          }}
          // 보이는 글자 줄은 스낵바 높이 그대로 두고 누르는 자리만 after로 44px까지 넓힌다
          // (상품 제목 아래 "후기" 버튼과 같은 방식)
          className="relative shrink-0 rounded-sm text-label-bold-14 after:absolute after:inset-x-0 after:-inset-y-2.75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          담기 취소
        </button>
      </div>
    ),
    SNACKBAR_OPTIONS,
  );
}
