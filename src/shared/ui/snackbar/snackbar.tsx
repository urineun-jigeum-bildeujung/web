// 장바구니 담기·찜하기처럼 가벼운 확인을 화면 하단에 알리는 스낵바.
// UI 시안 기준(상품 상세의 스낵바)이다. 하단 고정 버튼 바로 위 8px에 뜬다.
//
// margin-bottom으로 위치를 잡으면 sonner의 스택 높이 계산에 끼어, 토스트가 여러 개
// 쌓일 때 간격이 벌어진다 — bottom 유틸리티를 쓰는 이유다.

import { toast } from "sonner";

/** 확인하기 버튼처럼 스낵바 안에 직접 무엇을 더 그려야 할 때 이 클래스로 감싼다 */
export const SNACKBAR_CLASS =
  "pointer-events-auto relative bottom-13 flex min-h-9.5 w-[calc(100vw-40px)] max-w-88.25 items-center rounded-lg bg-surface-primary px-3 py-2 text-text-label-inverse";

export const SNACKBAR_OPTIONS = { className: "pointer-events-none" } as const;

/** 문구 한 줄만 있는 가장 흔한 경우. 버튼 등을 더 넣어야 하면 `SNACKBAR_CLASS`로 직접 그린다 */
export function showSnackbar(text: string) {
  toast.custom(
    () => (
      <div role="status" className={SNACKBAR_CLASS}>
        <span className="text-body-medium-14">{text}</span>
      </div>
    ),
    SNACKBAR_OPTIONS,
  );
}
