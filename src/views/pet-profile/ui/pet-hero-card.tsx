// 내 아이 관리 탭의 사진 카드. 사진 위에 이름·몸무게·질환을 세 줄로 얹고 줄마다 수정 화면으로 간다.
// UI 시안 기준(mypa_021 내 아이 관리, 1514-44230)이다.
//
// 아래 모서리는 시안이 radius/20인데 토큰(#169)에 20이 없어 16을 쓴다.
// 시안의 backdrop blur 4px은 흐린 사진 복사본 + 마스크로 낸다.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/shared/ui/badge/badge";
import { Icon } from "@/shared/ui/icon/icon";

export type PetHeroProfile = {
  /** 수정 화면에 어느 아이인지 넘긴다. 라우트가 아이를 가리지 않는다(#268) */
  id: string;
  name: string;
  /** "말티즈 · 4세 · 여자아이" */
  meta: string;
  /** "4kg" */
  weight: string;
  /** "보통" */
  bodyType: string;
  concerns: string[];
  allergies: string[];
  photoUrl?: string;
};

type PetHeroCardProps = {
  profile: PetHeroProfile;
};

/** 사진 위 정보 한 줄. 오른쪽 화살표가 그 항목의 수정 화면으로 간다 */
function InfoRow({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: string;
  /** 화살표를 읽는 이름. "기본 정보 수정" */
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-end gap-2.5 text-text-body-static-white">
        {children}
      </div>
      <Link
        href={href}
        aria-label={label}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-icon-fill-static-white transition-colors hover:bg-surface-overlay-static/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icon name="right" className="size-7" />
      </Link>
    </div>
  );
}

export function PetHeroCard({ profile }: PetHeroCardProps) {
  return (
    <section
      aria-label={`${profile.name}의 프로필`}
      className="relative mx-5 h-110.25 overflow-hidden rounded-t-lg rounded-b-2xl bg-surface-disable"
    >
      {profile.photoUrl ? (
        <>
          <Image
            src={profile.photoUrl}
            alt=""
            fill
            sizes="353px"
            priority
            className="object-cover object-top"
          />
          {/* 같은 사진을 흐리게 한 장 더 얹고 마스크로 위로 갈수록 지운다. backdrop-filter는
              Chrome에서 마스크를 따르지 않아 블러 경계가 선으로 보이므로 사진 자체를 흐린다 */}
          <Image
            aria-hidden
            src={profile.photoUrl}
            alt=""
            fill
            sizes="353px"
            className="mask-t-from-25% mask-t-to-50% object-cover object-top blur-xs"
          />
        </>
      ) : (
        <span aria-hidden className="flex h-full items-center justify-center">
          <Icon name="dog" className="size-20 text-icon-fill-tertiary" />
        </span>
      )}

      {/* 아래 절반을 어둡게 깔아 흰 글자가 사진 위에서도 읽히게 한다. 위로 갈수록 투명해진다 */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-54 bg-linear-to-b from-transparent to-text-body-static-black"
      />

      <div className="absolute inset-x-4 bottom-5 flex flex-col gap-4">
        <InfoRow href={`/mypage/pets/basic?petId=${profile.id}`} label="기본 정보 수정">
          <span className="truncate text-title-bold-18">{profile.name}</span>
          <span className="truncate text-body-medium-14">{profile.meta}</span>
        </InfoRow>

        <InfoRow href={`/mypage/pets/body?petId=${profile.id}`} label="체형 수정">
          <span className="text-title-bold-18">{profile.weight}</span>
          <span className="text-body-medium-14">{profile.bodyType}</span>
        </InfoRow>

        <InfoRow href={`/mypage/pets/health?petId=${profile.id}`} label="건강 정보 수정">
          <span className="flex min-w-0 flex-col gap-2">
            <span className="text-title-bold-18">걱정되는 질환 · 알러지</span>
            <span className="flex flex-wrap gap-2">
              {profile.concerns.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
              {profile.allergies.map((item) => (
                <Badge key={item} tone="danger">
                  {item}
                </Badge>
              ))}
            </span>
          </span>
        </InfoRow>
      </div>
    </section>
  );
}
