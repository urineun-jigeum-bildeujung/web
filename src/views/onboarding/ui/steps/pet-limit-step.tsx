// 아이를 더 들일 수 없을 때 첫 입력 단계 대신 보이는 안내. 5마리를 채운 보호자가 주소로 바로 들어온 경우다.
//
// 추가 자리는 5마리면 모두 사라지지만(QA No.130, #527) 주소창에 `/onboarding?step=basic`을 치면
// 들어올 수 있다. 백엔드 등록에는 개수 검사가 없어 입력칸을 그대로 두면 여섯째가 등록된다.
// 시안이 없는 자리라 빈 상태 컴포넌트로 까닭과 갈 곳만 보인다.

import { MAX_PETS } from "@/entities/pet";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";

type PetLimitStepProps = {
  /** 등록한 아이를 보러 간다 */
  onLeave: () => void;
};

export function PetLimitStep({ onLeave }: PetLimitStepProps) {
  return (
    <main className="flex flex-1 flex-col justify-center">
      <EmptyState
        title={`아이는 ${MAX_PETS}마리까지 등록할 수 있어요`}
        description="등록한 아이의 정보는 아이 관리에서 바꿀 수 있어요."
        action={<Button onClick={onLeave}>아이 관리로 가기</Button>}
      />
    </main>
  );
}
