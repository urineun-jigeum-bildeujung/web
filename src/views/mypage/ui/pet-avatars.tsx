// 마이페이지 프로필 카드의 아이 원 줄. 등록한 아이를 사진 원으로 보이고, 누르면 그 아이의 아이 관리로 간다.
// 끝의 점선 원은 새 아이를 들이는 자리다.
//
// **이 줄만 클라이언트다.** 마이페이지 홈은 서버 컴포넌트인데 아이 목록은 서버 상태라
// 훅이 필요하다. 화면 전체를 `use client`로 돌리면 메뉴 묶음까지 클라이언트로 내려간다.
//
// 고르는 자리가 아니라 아이 관리로 가는 링크라 `PetSwitcher`를 쓰지 않는다.
// 그것은 라디오 묶음이어서 링크 안에 넣으면 누르는 것이 둘로 갈린다.

"use client";

import Link from "next/link";

import { canAddPet, PetPhoto, toAddPetHref, useQueryPets } from "@/entities/pet";
import { Icon } from "@/shared/ui/icon/icon";
import { Skeleton } from "@/shared/ui/skeleton";

/** 원 하나의 지름. 시안(mypa_001)의 42px이다 */
const CIRCLE = "size-10.5 shrink-0 rounded-full";

/** 목록을 기다리는 동안 잡아 둘 자리. 시안이 보통 둘을 보여 준다 */
const PLACEHOLDER_COUNT = 2;

export function PetAvatars() {
  const { pets, isLoading } = useQueryPets();

  // 아이를 더 들이는 자리. 점선 원으로 비어 있음을 보인다. 새 아이는 온보딩 기본 정보 단계로
  // 잇는다 — 메인·아이 관리의 추가와 같은 곳이다(#189). **5마리를 채웠으면 그리지 않는다**(QA No.130, #527).
  // 목록을 아직 모르면(받는 중·실패) 남겨 둔다 — 아이가 없을 때도 할 일을 알리는 자리다
  const addLink = canAddPet(pets) && (
    <Link
      href={toAddPetHref("/mypage")}
      aria-label="새 아이 추가"
      className="flex size-10.5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-icon-fill-tertiary text-icon-fill-tertiary transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Icon name="plus" className="size-6" />
    </Link>
  );

  // 원을 처음 그리는 자리라 그릴 내용이 아직 없다. 비워 두면 뒤따르는 점선 원이
  // 왼쪽 끝에 붙어 있다가 목록이 오는 순간 오른쪽으로 밀린다. 받는 동안은 누를 곳이 아니라 링크로 감싸지 않는다
  if (isLoading) {
    return (
      <>
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
          <Skeleton
            key={index}
            {...(index === 0 && { role: "status", "aria-label": "아이 목록을 불러오는 중" })}
            className={`${CIRCLE} bg-surface-disable`}
          />
        ))}
        {addLink}
      </>
    );
  }

  // **원마다 따로 된 링크가 그 아이를 싣는다.** 줄 전체가 링크 하나였을 때는 어느 원을 눌러도
  // 아이 관리가 기본 아이(첫 번째)로 열렸다(QA No.129·181, #527). 아이가 없거나 목록을 못 받았으면
  // 원도 링크도 없다 — 빈 링크는 보이지 않는데도 Tab과 화면 낭독기에 잡힌다(#470 리뷰).
  // 사진이 없는 아이는 이름 앞 두 글자를 넣는다 — 회색 원만으로는 어느 아이인지 알 수 없었다(#470)
  return (
    <>
      {pets?.map((pet) => (
        <Link
          key={pet.id}
          href={`/mypage/pets?pet=${pet.id}`}
          aria-label={`${pet.name} 프로필 관리`}
          className="rounded-full transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden
            title={pet.name}
            className={`${CIRCLE} relative block overflow-hidden bg-surface-disable`}
          >
            <PetPhoto
              petId={pet.id}
              name={pet.name}
              photoUrl={pet.photoUrl}
              sizes="42px"
              // 시안 아이 원 42px의 글자 스타일
              textClassName="text-label-bold-14"
            />
          </span>
        </Link>
      ))}
      {addLink}
    </>
  );
}
