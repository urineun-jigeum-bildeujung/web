// 사진 한 장을 고르고 원형으로 미리 보여준다. 반려동물 프로필 사진에 쓴다.
// UI 시안 기준(onbo_002)이다.
// 기본 자리 그림은 세트의 카메라 아이콘이다(2026-09-21 PD팀이 세트에 더했다).
//
// 고른 파일을 바로 올리지 않고 상위에 넘긴다. 폼을 제출할 때 함께 보내야
// 작성을 중간에 그만뒀을 때 서버에 파일만 남는 일이 없다.
//
// 상위가 파일을 들고 있으면 `file`로 돌려받아 미리보기를 그 파일에서 만든다. 단계를 오가며 이
// 컴포넌트가 다시 그려져도 사진이 남는다(QA 온보딩, #602).

"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

import { useObjectUrl } from "./use-object-url";

type AvatarUploaderProps = {
  /** 파일을 고르거나 지웠을 때. 상위가 폼 상태로 들고 있다가 제출 때 함께 보낸다 */
  onFileChange: (file: File | null) => void;
  /**
   * 상위가 들고 있는 파일. 주면 미리보기를 이것으로 그린다 — 온보딩처럼 단계를 오가며 이
   * 컴포넌트가 다시 그려지는 화면이 넘긴다. 주지 않으면 고른 파일을 안에서 든다
   */
  file?: File | null;
  /** 이미 저장된 사진이 있을 때의 주소. 프로필 수정에서 쓴다 */
  defaultImageUrl?: string;
  /** 버튼을 설명하는 이름. 스크린 리더가 읽는다 */
  label?: string;
  /** 사진이 없을 때 원 안에 보일 그림. 기본은 카메라다 */
  placeholder?: ReactNode;
  /** 원의 크기. 온보딩은 80px(md), 정보 수정은 96px(lg)이다 */
  size?: "md" | "lg";
  className?: string;
};

export function AvatarUploader({
  onFileChange,
  file,
  defaultImageUrl,
  label = "반려동물 사진 등록",
  placeholder = <Icon name="camera" className="size-8 text-icon-fill-tertiary" />,
  size = "md",
  className,
}: AvatarUploaderProps) {
  const inputId = useId();
  const [picked, setPicked] = useState<File | null>(null);
  // **미리보기 주소를 안에만 들면 다시 그려질 때 사라진다.** 온보딩 두 번째 단계에서 "이전"을
  // 누르면 첫 단계가 새로 그려져 빈 원이 됐다 — 파일은 초안에 남아 실제로는 등록되는데도(#602).
  // 주소는 파일에서 만들고, 파일이 바뀌거나 화면에서 빠지면 거둔다
  const previewUrl = useObjectUrl(file === undefined ? picked : file);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    setPicked(nextFile);
    onFileChange(nextFile);
  }

  const shownUrl = previewUrl ?? defaultImageUrl;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-full bg-surface-disable transition-colors hover:bg-surface-tertiary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          size === "lg" ? "size-24" : "size-20",
        )}
      >
        <span className="sr-only">{label}</span>
        {shownUrl ? (
          // 방금 고른 로컬 파일이거나 외부 주소라 next/image의 최적화 대상이 아니다
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shownUrl} alt="" className="size-full rounded-full object-cover" />
        ) : (
          placeholder
        )}
        {/* 누르면 사진을 고를 수 있다는 것을 알리는 더하기 배지. 시안의 touch_guide */}
        <span
          aria-hidden
          className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-icon-stroke-inverse bg-surface-disable text-icon-fill-default"
        >
          <Icon name="plus" />
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
