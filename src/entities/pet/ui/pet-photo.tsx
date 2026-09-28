// 아이 원의 안쪽. 사진이 있으면 사진을, 없으면 이름 앞 두 글자를 옅은 바탕에 보인다.
// 시안의 아이 원 컴포넌트(avator, 3581:81940)가 사진 없는 아이를 이렇게 그린다(`state=default`).
// 회색 원만 남아 어느 아이인지 알 수 없었다(QA 1차 4번, #470).
//
// **바탕색은 아이마다 다르다.** PD가 색을 값이 아니라 공식으로 정했다 — H만 0~360에서 뽑고
// 채도·명도는 고정이다(`shared/lib/avatar`). H를 아이 id에서 뽑아 한 아이가 어느 화면에서나
// 같은 색이 된다. 바탕이 테마와 무관하게 밝아 글자는 뒤집히지 않는 짙은 색을 쓴다 (#488).

import Image from "next/image";

import { avatarColor } from "@/shared/lib/avatar/avatar-color";
import { avatarInitials } from "@/shared/lib/avatar/avatar-initials";
import { cn } from "@/shared/lib/utils";

type PetPhotoProps = {
  /** 바탕색을 정하는 값. 색이 id로 결정되므로 빠뜨릴 수 없다 */
  petId: string;
  name: string;
  photoUrl?: string;
  /** next/image `sizes`. 원 지름과 같게 준다 */
  sizes: string;
  /** 사진이 없을 때 글자 모양. 시안이 원 지름마다 다르다(56px `title-bold-16`, 48·42px `label-bold-14`) */
  textClassName: string;
};

/** 부모가 `relative`·`overflow-hidden`·`rounded-full`인 원이어야 한다. 그 원을 꽉 채운다 */
export function PetPhoto({ petId, name, photoUrl, sizes, textClassName }: PetPhotoProps) {
  if (photoUrl) {
    return <Image src={photoUrl} alt="" fill sizes={sizes} className="object-cover" />;
  }

  return (
    <span
      aria-hidden
      // 공식이 만드는 색은 토큰으로 셀 수 없어 클래스가 아니라 값으로 준다
      style={{ background: avatarColor(petId) }}
      className={cn(
        "absolute inset-0 flex items-center justify-center text-text-body-static-black",
        textClassName,
      )}
    >
      {avatarInitials(name)}
    </span>
  );
}
