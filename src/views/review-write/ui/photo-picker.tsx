// 사진을 정해진 장수만큼 붙이고 뺀다.
// UI 시안 기준(리뷰작성 1884-29325의 사진 첨부)이다. 칸 74px, 더하는 칸은 점선에 플러스와 장수.
// 시안에는 빼는 버튼이 없지만, 뺄 수 없으면 잘못 고른 사진을 되돌릴 길이 없어 24px X를 둔다.
//
// 고른 파일을 바로 올리지 않고 상위에 넘긴다. 리뷰를 등록할 때 함께 보내야
// 쓰다 말았을 때 서버에 사진만 남지 않는다. AvatarUploader와 같은 판단이다.

"use client";

import Image from "next/image";
import { useEffect, useId, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type PhotoPickerProps = {
  files: File[];
  onChange: (next: File[]) => void;
  /** 몇 장까지 받을지 */
  max?: number;
  className?: string;
};

export function PhotoPicker({ files, onChange, max = 3, className }: PhotoPickerProps) {
  const inputId = useId();

  // React Compiler가 있어도 useMemo를 남긴다. 값을 아끼려는 것이 아니라
  // 렌더마다 새 주소가 생기는 것을 막으려는 것이다 — 그러면 아래 정리가 헛돈다
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  // 다 쓴 주소는 반드시 거둬들인다. 그러지 않으면 고를 때마다 메모리에 쌓인다
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const full = files.length >= max;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {files.map((file, index) => (
        <div key={`${file.name}-${file.lastModified}`} className="relative">
          {/* blob: 주소는 next/image가 알아서 최적화를 건너뛴다. 설정할 것이 없다 */}
          <Image
            src={previews[index]}
            alt={`첨부한 사진 ${index + 1}`}
            width={74}
            height={74}
            className="size-18.5 rounded-lg bg-surface-disable object-cover"
          />
          <button
            type="button"
            aria-label={`${index + 1}번째 사진 빼기`}
            onClick={() => onChange(files.filter((_, at) => at !== index))}
            // 보이는 크기는 24px로 두되 누를 수 있는 자리는 44px로 넓힌다.
            // 사진 위에 얹히는 자리라 동그라미를 키우면 사진을 가린다
            className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background after:absolute after:-inset-2.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon name="cancel" className="size-4" />
          </button>
        </div>
      ))}

      {/* 다 채우면 더할 자리를 없앤다. 눌러도 아무 일 없는 칸을 남기지 않는다 */}
      {!full && (
        <>
          <label
            htmlFor={inputId}
            // 숫자만 읽히면 무엇을 하는 자리인지 알 수 없어 이름을 따로 준다
            aria-label={`사진 추가 (${files.length}/${max})`}
            className="flex size-18.5 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-default bg-background text-text-body-secondary focus-within:ring-2 focus-within:ring-ring"
          >
            <Icon name="plus" className="size-5" />
            <span aria-hidden className="text-label-medium-11">
              {files.length}/{max}
            </span>
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              // 남은 자리만큼만 받는다. 한 번에 여러 장을 골라도 넘치지 않는다
              onChange([...files, ...picked].slice(0, max));
              // 같은 파일을 다시 고를 수 있게 값을 비운다
              event.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
