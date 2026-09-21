// 마이페이지 프로필 카드의 닉네임·이메일 줄. 내 정보로 가는 링크 안에 들어간다.
//
// **이 줄만 클라이언트다.** 마이페이지 홈은 서버 컴포넌트인데 회원 정보는 서버 상태라
// 훅이 필요하다. 화면 전체를 `use client`로 돌리면 메뉴 묶음까지 클라이언트로 내려간다.

"use client";

import { useQueryMyProfile } from "@/entities/member";
import { Skeleton } from "@/shared/ui/skeleton";

export function ProfileSummary() {
  const { profile, isLoading, error } = useQueryMyProfile();

  // **못 받은 것과 비어 있는 것은 다른 사실이다.** 빈 줄로 두면 카드가 고장 난 것처럼
  // 보이고, 보호자는 왜 이름이 없는지 알 수 없다
  if (error) {
    return (
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span role="alert" className="truncate text-body-medium-14 text-text-body-secondary">
          내 정보를 불러오지 못했어요
        </span>
      </span>
    );
  }

  // 두 줄을 처음 그리는 자리라 그릴 내용이 아직 없다. 글자 높이로 자리를 잡아
  // 받아오는 순간 카드가 늘었다 줄지 않게 한다
  if (isLoading) {
    return (
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton role="status" aria-label="내 정보를 불러오는 중" className="h-4 w-28" />
        <Skeleton className="h-3.5 w-40" />
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-title-bold-16 text-foreground">{profile?.nickname}</span>
      <span className="truncate text-body-regular-13 text-text-body-tertiary">
        {profile?.email}
      </span>
    </span>
  );
}
