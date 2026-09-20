// 내 회원 정보 조회와 수정.
//
// **이 값은 여러 화면이 함께 쓴다.** 마이페이지 홈의 프로필 카드, 내 정보 화면의 다섯 줄,
// 닉네임 수정 화면이 같은 것을 본다. 그래서 뷰가 아니라 엔티티에 둔다.

import { apiRequest } from "@/shared/api/client";

/** 백엔드 `MemberMyProfileResponse`와 같은 모양이다 */
export type MemberProfile = {
  nickname: string;
  /** 아직 받는 자리가 없어 늘 비어 있다 */
  name: string | null;
  /** `YYYY-MM-DD`. 아직 받는 자리가 없다 */
  birth: string | null;
  /** 휴대폰 인증을 마쳐야 생긴다 */
  phone: string | null;
  /** 프로필 사진 URL */
  image: string | null;
  email: string;
};

/**
 * 고칠 것만 보낸다.
 *
 * **전 필드가 선택이다.** 닉네임만 고치는 화면이 이름·생일을 덮어쓰지 않게 하려면
 * 보내지 않아야 한다.
 */
export type MemberProfileUpdate = Partial<Pick<MemberProfile, "nickname" | "name" | "birth">> & {
  image?: string;
};

export function getMyProfile(): Promise<MemberProfile> {
  return apiRequest<MemberProfile>("/members/me");
}

export function updateMyProfile(patch: MemberProfileUpdate): Promise<void> {
  return apiRequest<void>("/members/me", { method: "PATCH", body: patch });
}

/**
 * 회원 탈퇴.
 *
 * **되돌릴 수 없다.** 서버가 accessToken을 블랙리스트에 올리고 저장된 refreshToken을
 * 지우므로, 부른 쪽은 기기의 토큰도 함께 비워야 한다.
 */
export function withdraw(): Promise<void> {
  return apiRequest<void>("/members/me", { method: "DELETE" });
}
