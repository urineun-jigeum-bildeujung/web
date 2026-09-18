// 마이페이지 프로필 카드의 아이 원 줄. 등록한 아이를 사진 원으로 보인다.
//
// **이 줄만 클라이언트다.** 마이페이지 홈은 서버 컴포넌트인데 아이 목록은 서버 상태라
// 훅이 필요하다. 화면 전체를 `use client`로 돌리면 메뉴 묶음까지 클라이언트로 내려간다.
//
// 고르는 자리가 아니라 아이 관리로 가는 링크 안이라 `PetSwitcher`를 쓰지 않는다.
// 그것은 라디오 묶음이어서 링크 안에 넣으면 누르는 것이 둘로 갈린다.

"use client";

import Image from "next/image";

import { useQueryPets } from "@/entities/pet";

/** 원 하나의 지름. 시안(mypa_001)의 42px이다 */
const CIRCLE = "size-10.5 shrink-0 rounded-full";

export function PetAvatars() {
  const { pets } = useQueryPets();

  // 아직 못 받았거나 등록한 아이가 없으면 아무것도 그리지 않는다.
  // 뒤따르는 점선 원이 "아이를 들이는 자리"로 남아 할 일을 알린다
  return (
    <>
      {(pets ?? []).map((pet) => (
        <span
          key={pet.id}
          aria-hidden
          title={pet.name}
          className={`${CIRCLE} relative overflow-hidden bg-surface-disable`}
        >
          {pet.photoUrl && (
            <Image src={pet.photoUrl} alt="" fill sizes="42px" className="object-cover" />
          )}
        </span>
      ))}
    </>
  );
}
