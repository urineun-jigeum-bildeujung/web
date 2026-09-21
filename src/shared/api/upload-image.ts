// 이미지 한 장을 S3에 직접 올리고 저장할 주소(fileUrl)를 돌려준다.
//
// **백엔드는 파일을 받지 않는다.** 백엔드가 자기 자격증명으로 서명한 PUT 주소(presigned URL)를
// 주면 프론트가 그 주소로 S3에 바로 올린다. 서명이 주소 안에 있어 프론트에는 AWS 키가 없다.
//
// 절차는 세 단계다.
//   1. 확장자를 보내 서명된 주소를 받는다   (발급 함수는 도메인마다 다르다)
//   2. 그 주소로 PUT 한다                  (`x-amz-tagging: status=pending` 필수)
//   3. 응답의 `fileUrl`을 등록·수정 요청에 실어 보낸다
//
// **`x-amz-tagging` 헤더를 빠뜨리면 S3가 403으로 거절한다.** 서명에 그 조건이 들어 있다.
// 저장 요청이 성공하면 백엔드가 태그를 `confirmed`로 바꾸고, `pending`으로 남은 파일은
// 버킷 라이프사이클이 3일 뒤 지운다. 올렸다가 등록을 그만둬도 프론트가 치울 것은 없다.
//
// 회원 프로필과 아이 사진은 같은 발급 엔드포인트를 쓴다. 두 엔티티가 같은 레이어라 서로
// import할 수 없어 발급 함수를 여기 두고, 리뷰처럼 발급 주소가 다른 곳은 자기 함수를 넘긴다.

import { apiRequest } from "./client";

/** 백엔드 `ProfileImageUploadResponse`·`ReviewImageUploadResponse`와 같은 모양이다 */
export type PresignedUpload = {
  /** 서명된 S3 PUT 주소. 10분 뒤 만료된다 */
  uploadUrl: string;
  /** 저장·조회에 쓰는 CDN 주소. 이것을 등록 요청에 싣는다 */
  fileUrl: string;
};

export type IssuePresignedUpload = (extension: string) => Promise<PresignedUpload>;

/**
 * S3 PUT이 실패했을 때 던진다.
 *
 * S3는 `ProblemDetail`을 주지 않아 `ApiError`로 담을 수 없다. 따로 두어야 문구를 고를 때
 * "요청 실패"가 아니라 사진을 다시 고르라고 알릴 수 있다.
 */
export class ImageUploadError extends Error {
  constructor(readonly status: number) {
    super(`이미지 업로드 실패 (${status})`);
    this.name = "ImageUploadError";
  }
}

const PENDING_TAG = "status=pending";

/** MIME으로 보충하는 확장자. 이름에 점이 없는 파일(카메라 촬영·클립보드)이 여기로 온다 */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * 발급 요청에 보낼 확장자. 이름의 마지막 점 뒤를 쓰고, 없으면 MIME으로 보충한다.
 *
 * 허용 여부는 서버가 판단한다(`jpg`·`jpeg`·`png`·`webp`·`gif`). 여기서 거르면 목록을
 * 두 곳에서 들게 된다 — 서버가 거절하면 `INVALID_IMAGE_EXTENSION`으로 알린다.
 */
export function fileExtension(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot > 0 && dot < file.name.length - 1) {
    return file.name.slice(dot + 1).toLowerCase();
  }
  return EXTENSION_BY_MIME[file.type] ?? "";
}

/** 회원 프로필·아이 사진의 발급. 백엔드가 회원 단위로 소유자를 묶는다 */
export function issueProfileImageUpload(extension: string): Promise<PresignedUpload> {
  return apiRequest<PresignedUpload>("/members/me/profile-image/presigned-url", {
    method: "POST",
    body: { extension },
  });
}

/**
 * 서명된 주소로 S3에 올린다. `apiRequest`를 쓰지 않는다 — 우리 API가 아니라
 * Authorization을 붙이면 안 되고, 실패 본문도 `ProblemDetail`이 아니다.
 *
 * `Content-Type`은 서명 조건에 없어 파일의 것을 그대로 보낸다. 없으면 브라우저 기본값이다.
 */
async function putToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const headers: Record<string, string> = { "x-amz-tagging": PENDING_TAG };
  if (file.type) {
    headers["Content-Type"] = file.type;
  }

  const response = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!response.ok) {
    throw new ImageUploadError(response.status);
  }
}

/**
 * 이미지 한 장을 올리고 저장할 주소를 돌려준다.
 *
 * 기본은 회원·아이 사진 발급이다. 발급 주소가 다른 도메인(리뷰)은 `issue`를 넘긴다.
 */
export async function uploadImage(
  file: File,
  issue: IssuePresignedUpload = issueProfileImageUpload,
): Promise<string> {
  const { uploadUrl, fileUrl } = await issue(fileExtension(file));
  await putToPresignedUrl(uploadUrl, file);
  return fileUrl;
}
