// 사진 한 장을 고르고 원형으로 미리 보여준다. 반려동물 프로필 사진에 쓴다.
// 와이어프레임 기준(onbo_002)이라 디자인 확정 시 바뀔 수 있다.
//
// 고른 파일을 바로 올리지 않고 상위에 넘긴다. 폼을 제출할 때 함께 보내야
// 작성을 중간에 그만뒀을 때 서버에 파일만 남는 일이 없다.

"use client";

import { useEffect, useId, useMemo } from "react";
import { IoCameraOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type AvatarUploaderProps = {
  /** 고른 파일. 상위가 폼 상태로 들고 있는다 */
  file?: File | null;
  onFileChange: (file: File | null) => void;
  /** 이미 저장된 사진이 있을 때의 주소. 프로필 수정에서 쓴다 */
  defaultImageUrl?: string;
  /** 버튼을 설명하는 이름. 스크린 리더가 읽는다 */
  label?: string;
  className?: string;
};

export function AvatarUploader({
  file,
  onFileChange,
  defaultImageUrl,
  label = "반려동물 사진 등록",
  className,
}: AvatarUploaderProps) {
  const inputId = useId();

  // 미리보기 주소는 file에서 파생되는 값이라 상태로 두지 않는다.
  // 메모이제이션이 아니라 파일당 주소를 하나로 고정하려는 목적이다.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // createObjectURL이 만든 주소는 직접 해제해야 메모리에 남지 않는다
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownUrl = previewUrl ?? defaultImageUrl;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <label
        htmlFor={inputId}
        className="flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-colors hover:bg-muted/70 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
      >
        <span className="sr-only">{label}</span>
        {shownUrl ? (
          // 사용자가 방금 고른 로컬 파일이라 next/image의 최적화 대상이 아니다
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shownUrl} alt="" className="size-full object-cover" />
        ) : (
          <IoCameraOutline aria-hidden className="size-8 text-muted-foreground" />
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
