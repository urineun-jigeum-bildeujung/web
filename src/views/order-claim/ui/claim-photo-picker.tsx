// 사진을 세 장까지 붙이고 뺀다. 고른 파일은 바로 올리지 않고 위로 넘긴다 — 접수할 때 함께 올린다.
// UI 시안 기준(mypa_261 3333:37494의 사진 첨부)이다. 칸 74, 점선, 모서리 12, 플러스 20과 장수 (#408).
//
// **리뷰 작성의 사진 고르기(views/review-write)를 가져다 쓰지 않는다.** 같은 views 층이라 import할
// 수 없고, 신청 시안에는 사진첩·카메라를 가르는 시트가 없다. 파일 입력 하나로 열고, 휴대폰에서는
// 운영체제가 사진첩·카메라를 고르게 한다.
//
// 시안에는 빼는 버튼이 없지만, 뺄 수 없으면 잘못 고른 사진을 되돌릴 길이 없어 24px X를 둔다
// (리뷰 작성과 같은 판단).

"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";

import { Icon } from "@/shared/ui/icon/icon";

/** 시안의 장수 표시(0/3) */
export const PHOTO_MAX = 3;

type ClaimPhotoPickerProps = {
  photos: File[];
  onChange: (next: File[]) => void;
};

export function ClaimPhotoPicker({ photos, onChange }: ClaimPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // React Compiler가 있어도 useMemo를 남긴다. 값을 아끼려는 것이 아니라
  // 렌더마다 새 주소가 생기는 것을 막으려는 것이다 — 그러면 아래 정리가 헛돈다
  const previews = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos]);

  // 다 쓴 주소는 반드시 거둬들인다. 그러지 않으면 고를 때마다 메모리에 쌓인다
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const full = photos.length >= PHOTO_MAX;

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((photo, index) => (
        // 같은 파일을 두 번 고를 수 있어 파일 정보만으로는 키가 겹친다
        <div key={`${photo.name}-${photo.lastModified}-${index}`} className="relative">
          {/* blob: 주소는 next/image가 알아서 최적화를 건너뛴다. 설정할 것이 없다 */}
          <Image
            src={previews[index]}
            alt={`첨부한 사진 ${index + 1}`}
            width={74}
            height={74}
            className="size-18.5 rounded-xl bg-surface-disable object-cover"
          />
          <button
            type="button"
            aria-label={`${index + 1}번째 사진 빼기`}
            onClick={() => onChange(photos.filter((_, at) => at !== index))}
            // 보이는 크기는 24px로 두되 누를 수 있는 자리는 44px로 넓힌다
            className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background after:absolute after:-inset-2.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon name="cancel" className="size-4" />
          </button>
        </div>
      ))}

      {/* 다 채우면 더할 자리를 없앤다. 눌러도 아무 일 없는 칸을 남기지 않는다 */}
      {!full && (
        <button
          type="button"
          // 숫자만 읽히면 무엇을 하는 자리인지 알 수 없어 이름을 따로 준다
          aria-label={`사진 추가 (${photos.length}/${PHOTO_MAX})`}
          onClick={() => inputRef.current?.click()}
          className="flex size-18.5 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-default bg-background text-text-body-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon name="plus" className="size-5" />
          <span aria-hidden className="text-label-medium-11">
            {photos.length}/{PHOTO_MAX}
          </span>
        </button>
      )}

      {/* 초점은 위 버튼이 받으므로 탭 순서에서 뺀다 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label="첨부할 사진 고르기"
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          // 남은 자리만큼만 받는다. 한 번에 여러 장을 골라도 넘치지 않는다
          const picked = Array.from(event.target.files ?? []);
          onChange([...photos, ...picked].slice(0, PHOTO_MAX));
          // 같은 파일을 다시 고를 수 있게 값을 비운다
          event.target.value = "";
        }}
      />
    </div>
  );
}
