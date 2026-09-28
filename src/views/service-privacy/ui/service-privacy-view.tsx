// 개인정보 처리방침 화면.
// 시안이 아직 없어(#209) 기능정의서(마이페이지 ver0.5 "개인 정보 처리 방침 조회")의 항목 — 시행일,
// 수집·이용 목적, 수집 항목, 보유 기간 — 을 예시 본문으로 채운다 (#502).
// 회원가입 약관 동의(sign_001)의 보기에서도 들어온다.

import { PageHeader } from "@/shared/ui/page-header/page-header";
import { PolicyDocument } from "@/shared/ui/policy-document/policy-document";

import { PRIVACY_EFFECTIVE_DATE, PRIVACY_SECTIONS } from "../config/privacy-sections";

export function ServicePrivacyView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="개인정보 처리방침" />

      <main className="flex flex-1 flex-col px-5 pt-2 pb-8">
        <PolicyDocument effectiveDate={PRIVACY_EFFECTIVE_DATE} sections={PRIVACY_SECTIONS} />
      </main>
    </div>
  );
}
