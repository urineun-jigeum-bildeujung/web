// 배송지 설정에서 고른 곳을 한 칸 뒤의 결제 화면에 넘긴다 (QA No.40 리뷰, #595).
//
// **고르면 목록이 한 칸 되돌아가고 결제 화면이 그 기록의 주소만 바꾼다.** 되돌아가는 쪽은 주소에
// 값을 실을 수 없어 여기 잠깐 적어 두고, 결제 화면이 읽는 즉시 지운다. 주소(`?address=`)에 옮겨
// 적은 뒤로는 새로고침에도 주소가 들고 있다.
//
// **`sessionStorage`다.** 목록을 새로고침한 뒤 고르면 한 칸 뒤 결제 화면은 다른 문서라, 메모리에
// 둔 값은 건너가지 못한다. 탭 밖으로 샐 값도 아니다.

import { readAddressId } from "./return-query";

const KEY = "checkout.pickedAddress";

/** 적지 못하면 `false`다. 그때 부르는 쪽은 되돌아가지 않고 새 결제 화면으로 바꿔 끼운다 */
export function writePickedAddress(addressId: number): boolean {
  try {
    sessionStorage.setItem(KEY, String(addressId));
    return true;
  } catch {
    return false;
  }
}

/** 넘겨받은 배송지 id. **읽으면 지운다** — 남기면 다음에 연 결제 화면이 또 바꾼다 */
export function takePickedAddress(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return readAddressId(raw);
  } catch {
    return null;
  }
}
