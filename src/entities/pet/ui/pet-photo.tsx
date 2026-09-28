// 아이 원의 안쪽. 사진이 있으면 사진을, 없으면 이름 앞 두 글자를 옅은 바탕에 보인다.
// 시안의 아이 원 컴포넌트(avator, 3581:81940)가 사진 없는 아이를 이렇게 그린다(`state=default`).
// 회색 원만 남아 어느 아이인지 알 수 없었다(QA 1차 4번, #470).
//
// **바탕색은 시안과 다르다.** 시안의 #FFFAB2는 디자인 변수에 묶이지 않은 색이라 우리 토큰에 없다.
// 하드코딩하지 않고 가장 가까운 옅은 따뜻한 바탕(`surface-brand-weak`)으로 두었다. 글자도
// 다크 모드에서 읽히도록 바탕과 짝인 `text-body-default`를 쓴다. PD팀에 변수 추가를 요청할 후보다.

import Image from "next/image";

import { cn } from "@/shared/lib/utils";

import { petInitials } from "../model/pet-initials";

type PetPhotoProps = {
  name: string;
  photoUrl?: string;
  /** next/image `sizes`. 원 지름과 같게 준다 */
  sizes: string;
  /** 사진이 없을 때 글자 모양. 시안이 원 지름마다 다르다(56px `title-bold-16`, 48·42px `label-bold-14`) */
  textClassName: string;
};

/** 부모가 `relative`·`overflow-hidden`·`rounded-full`인 원이어야 한다. 그 원을 꽉 채운다 */
export function PetPhoto({ name, photoUrl, sizes, textClassName }: PetPhotoProps) {
  if (photoUrl) {
    return <Image src={photoUrl} alt="" fill sizes={sizes} className="object-cover" />;
  }

  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-surface-brand-weak text-text-body-default",
        textClassName,
      )}
    >
      {petInitials(name)}
    </span>
  );
}
