// 서비스 이용약관 화면.
// 시안이 아직 없어(#209) 기능정의서(마이페이지 ver0.5 "서비스 이용약관 조회")의 항목 — 시행일,
// 목차, 전문 — 을 예시 조항으로 채운다 (#502). 회원가입 약관 동의(sign_001)의 보기에서도 들어온다.

import { PageHeader } from "@/shared/ui/page-header/page-header";
import { PolicyDocument } from "@/shared/ui/policy-document/policy-document";

import { TERMS_EFFECTIVE_DATE, TERMS_SECTIONS } from "../config/terms-sections";

export function ServiceTermsView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="서비스 이용약관" />

      <main className="flex flex-1 flex-col px-5 pt-2 pb-8">
        <PolicyDocument effectiveDate={TERMS_EFFECTIVE_DATE} sections={TERMS_SECTIONS} />
      </main>
    </div>
  );
}
