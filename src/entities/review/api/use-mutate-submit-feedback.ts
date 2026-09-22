// 반응을 등록하는 훅. 화면은 `useMutation`을 직접 부르지 않는다 (code-convention "훅").

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { submitFeedback } from "./feedbacks";

/**
 * 반응을 남기거나 보류한다.
 *
 * 성공하면 남길 수 있는 목록을 무효화한다. 답한 항목은 서버가 목록에서 빼고 보류한 항목은
 * 7일 뒤에 다시 넣으므로, 비우지 않으면 방금 답한 카드가 그대로 남는다.
 */
export function useMutateSubmitFeedback() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review.feedbackPending() }),
  });

  return {
    submitFeedback: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
