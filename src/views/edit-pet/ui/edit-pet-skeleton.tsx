// 아이 정보 수정 화면이 저장된 값을 기다리는 동안 잡아 둘 자리.
//
// **세 화면이 모양은 달라도 골격은 같다** — 제목 한 줄 아래 입력칸이 늘어선다.
// 자리를 안 잡으면 빈 화면이었다가 갑자기 차서 눌리는 자리가 밀린다.

import { Skeleton } from "@/shared/ui/skeleton";

export function EditPetSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-5" role="status" aria-label="아이 정보를 불러오는 중">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          {/* 항목 제목(title/bold_16) 높이 */}
          <Skeleton className="h-6 w-48" />
          {/* 입력칸 44px */}
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
