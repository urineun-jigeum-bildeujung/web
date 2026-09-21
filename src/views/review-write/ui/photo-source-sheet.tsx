// 사진을 어디서 가져올지 고르는 시트. 사진첩과 카메라 두 줄, 아래에 "확인".
// UI 시안 기준(리뷰작성 2729-101147)이다. 손잡이·제목 18 굵게·줄 48px·버튼 40px.
//
// 줄을 누르면 바로 그 경로가 열린다. "확인"은 시트를 닫기만 한다 — 시안의 라벨이 비어 있어
// PD와 "확인"으로 정했고, 여는 일은 줄이 이미 하므로 확인이 또 열 이유가 없다.
// 파일 입력은 이 시트 밖(PhotoPicker)에 있다. 시트가 닫힌 뒤에도 고른 파일이 도착해야 한다.

"use client";

import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { Icon } from "@/shared/ui/icon/icon";

type PhotoSourceSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 더 붙일 자리가 있는가. 다 찼으면 두 줄 다 잠근다 */
  canAdd: boolean;
  onPickGallery: () => void;
  onPickCamera: () => void;
};

/** 시안의 줄. 아이콘 24 + 글자 16, 높이 48, 좌우 20 */
const ROW_CLASS =
  "flex h-12 w-full items-center gap-2 px-5 text-body-medium-16 text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:text-text-body-tertiary disabled:hover:bg-transparent";

export function PhotoSourceSheet({
  open,
  onOpenChange,
  canAdd,
  onPickGallery,
  onPickCamera,
}: PhotoSourceSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} className="px-5 pb-4">
      {/* 손잡이(40)와 제목 사이 8, 제목과 줄 사이 12, 줄과 버튼 사이 12 */}
      <DrawerHeader className="p-0 pt-2">
        <DrawerTitle className="text-left text-title-bold-18 text-foreground">
          사진 첨부하기
        </DrawerTitle>
      </DrawerHeader>

      <div className="mt-3 flex flex-col">
        <button type="button" className={ROW_CLASS} disabled={!canAdd} onClick={onPickGallery}>
          <Icon name="image" className="text-icon-fill-secondary" />
          사진첩
        </button>
        <button type="button" className={ROW_CLASS} disabled={!canAdd} onClick={onPickCamera}>
          <Icon name="camera" className="text-icon-fill-secondary" />
          카메라
        </button>
      </div>

      <Button className="mt-3 h-10 text-label-bold-14" onClick={() => onOpenChange(false)}>
        확인
      </Button>
    </BottomSheet>
  );
}
