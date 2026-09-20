// 내 회원 정보를 가져오는 훅. 화면은 `useQuery`를 직접 부르지 않는다 (code-convention "훅").

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { getMyProfile } from "./profile";

export function useQueryMyProfile() {
  const query = useQuery({
    queryKey: QUERY_KEYS.user.me(),
    queryFn: getMyProfile,
  });

  return {
    profile: query.data,
    isLoading: query.isPending,
    error: query.error,
  };
}
