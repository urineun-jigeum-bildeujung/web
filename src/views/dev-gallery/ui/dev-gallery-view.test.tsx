// 개발용 갤러리 스모크 테스트. 컴포넌트를 추가하다 화면이 깨지면 여기서 걸린다.
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { DevGalleryView } from "./dev-gallery-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

test("모든 구역이 렌더링된다", () => {
  render(<DevGalleryView />);

  for (const title of [
    "StepProgress",
    "AvatarUploader",
    "FormField",
    "ChipSelect",
    "CheckboxRow",
    "Price",
    "Rating",
    "QuantityStepper",
    "MatchScoreBadge",
    "OrderStatusBadge",
    "ProductSummary",
    "ProductGridCard",
    "CompareSlot",
    "CompareTable",
    "ListRow · SettingGroup",
    "DefinitionRow",
    "DetailCard",
    "AddressResultList",
    "PetSwitcher",
    "ProductReviewSheet",
    "InfoNotice",
    "EmptyState",
    "ErrorBoundary",
    "Skeleton",
    "여기서 볼 수 없는 것",
  ]) {
    expect(screen.getByRole("heading", { name: title })).toBeDefined();
  }
});
